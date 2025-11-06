const { faker } = require('@faker-js/faker');
const { pool } = require('../config/database');

class SocketHandler {
    constructor(io) {
        this.io = io;
        this.onlineUsers = new Map(); // deviceId -> socketId
    }

    // Generate unique device ID and name
    async generateDeviceInfo() {
        const deviceName = faker.internet.username();
        const deviceId = faker.string.alphanumeric(16);
        return { deviceId, deviceName };
    }

    // Register or get existing device
    async registerDevice(deviceId, deviceName) {
        try {
            // Check if device exists
            const [rows] = await pool.query(
                'SELECT * FROM users WHERE device_id = ?',
                [deviceId]
            );

            if (rows.length > 0) {
                // Update last seen
                await pool.query(
                    'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE device_id = ?',
                    [deviceId]
                );
                return rows[0];
            }

            // Create new device
            await pool.query(
                'INSERT INTO users (device_id, device_name) VALUES (?, ?)',
                [deviceId, deviceName]
            );

            return { device_id: deviceId, device_name: deviceName };
        } catch (error) {
            console.error('Error registering device:', error);
            throw error;
        }
    }

    // Save message to database
    async saveMessage(senderDeviceId, receiverDeviceId, message, isBroadcast = false) {
        try {
            const [result] = await pool.query(
                'INSERT INTO messages (sender_device_id, receiver_device_id, message, is_broadcast) VALUES (?, ?, ?, ?)',
                [senderDeviceId, receiverDeviceId, message, isBroadcast]
            );
            
            const [messageData] = await pool.query(
                'SELECT * FROM messages WHERE id = ?',
                [result.insertId]
            );
            
            return messageData[0];
        } catch (error) {
            console.error('Error saving message:', error);
            throw error;
        }
    }

    // Get chat history
    async getChatHistory(deviceId, limit = 50) {
        try {
            const [rows] = await pool.query(
                `SELECT m.*, u.device_name as sender_name 
                FROM messages m 
                LEFT JOIN users u ON m.sender_device_id = u.device_id
                WHERE m.receiver_device_id = ? OR m.sender_device_id = ? OR m.is_broadcast = TRUE
                ORDER BY m.timestamp DESC 
                LIMIT ?`,
                [deviceId, deviceId, limit]
            );
            // Convert snake_case to camelCase for frontend
            const messages = rows.map(row => ({
                id: row.id,
                message: row.message,
                senderDeviceId: row.sender_device_id,
                senderName: row.sender_name,
                receiverDeviceId: row.receiver_device_id,
                timestamp: row.timestamp,
                isBroadcast: row.is_broadcast
            }));
            return messages.reverse();
        } catch (error) {
            console.error('Error getting chat history:', error);
            throw error;
        }
    }

    // Handle socket connections
    handleConnection(socket) {
        console.log('New client connected:', socket.id);

        // Handle device registration/authentication
        socket.on('register', async (data, callback) => {
            try {
                let deviceInfo;
                
                if (data && data.deviceId) {
                    // Existing device
                    deviceInfo = await this.registerDevice(data.deviceId, data.deviceName || 'Unknown');
                } else {
                    // New device - generate credentials
                    const newDeviceInfo = await this.generateDeviceInfo();
                    deviceInfo = await this.registerDevice(newDeviceInfo.deviceId, newDeviceInfo.deviceName);
                }

                // Store device mapping
                this.onlineUsers.set(deviceInfo.device_id, socket.id);
                socket.deviceId = deviceInfo.device_id;
                socket.deviceName = deviceInfo.device_name;

                // Join personal room
                socket.join(deviceInfo.device_id);

                // Get chat history
                const history = await this.getChatHistory(deviceInfo.device_id);

                // Send response
                if (callback) {
                    callback({
                        success: true,
                        deviceId: deviceInfo.device_id,
                        deviceName: deviceInfo.device_name,
                        history: history
                    });
                }

                // Notify others
                socket.broadcast.emit('user_connected', {
                    deviceId: deviceInfo.device_id,
                    deviceName: deviceInfo.device_name
                });

                console.log(`Device registered: ${deviceInfo.device_id} (${deviceInfo.device_name})`);
            } catch (error) {
                console.error('Registration error:', error);
                if (callback) {
                    callback({ success: false, error: error.message });
                }
            }
        });

        // Handle message sending
        socket.on('send_message', async (data, callback) => {
            try {
                if (!socket.deviceId) {
                    throw new Error('Device not registered');
                }

                const { message, receiverDeviceId } = data;
                const isBroadcast = !receiverDeviceId;

                // Save message to database
                const savedMessage = await this.saveMessage(
                    socket.deviceId,
                    receiverDeviceId || null,
                    message,
                    isBroadcast
                );

                const messageData = {
                    id: savedMessage.id,
                    senderDeviceId: socket.deviceId,
                    senderName: socket.deviceName,
                    receiverDeviceId: receiverDeviceId || null,
                    message: message,
                    timestamp: savedMessage.timestamp,
                    isBroadcast: isBroadcast
                };

                if (isBroadcast) {
                    // Broadcast to all clients
                    this.io.emit('new_message', messageData);
                } else {
                    // Send to specific receiver
                    const receiverSocketId = this.onlineUsers.get(receiverDeviceId);
                    if (receiverSocketId) {
                        this.io.to(receiverSocketId).emit('new_message', messageData);
                    }
                    // Send back to sender for confirmation
                    socket.emit('new_message', messageData);
                }

                if (callback) {
                    callback({ success: true, message: messageData });
                }
            } catch (error) {
                console.error('Error sending message:', error);
                if (callback) {
                    callback({ success: false, error: error.message });
                }
            }
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            if (data.receiverDeviceId) {
                const receiverSocketId = this.onlineUsers.get(data.receiverDeviceId);
                if (receiverSocketId) {
                    this.io.to(receiverSocketId).emit('user_typing', {
                        deviceId: socket.deviceId,
                        deviceName: socket.deviceName,
                        isTyping: data.isTyping
                    });
                }
            }
        });

        // Handle get online users
        socket.on('get_online_users', (callback) => {
            const users = Array.from(this.onlineUsers.keys()).map(deviceId => ({
                deviceId: deviceId
            }));
            if (callback) {
                callback({ users });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            if (socket.deviceId) {
                this.onlineUsers.delete(socket.deviceId);
                socket.broadcast.emit('user_disconnected', {
                    deviceId: socket.deviceId,
                    deviceName: socket.deviceName
                });
                console.log(`Device disconnected: ${socket.deviceId}`);
            }
            console.log('Client disconnected:', socket.id);
        });
    }
}

module.exports = SocketHandler;
