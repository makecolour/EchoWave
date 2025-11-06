# EchoWave 🌊

A real-time WebSocket messaging server built with Node.js, Express, Socket.IO, Redis, and MySQL. EchoWave supports multi-cluster deployments, persistent chat history, and automatic device registration.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Web Client](#web-client)
- [Android Client](#android-client)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Real-time Messaging**: Instant message delivery using WebSocket (Socket.IO)
- **Multi-Cluster Support**: Horizontal scaling with Redis pub/sub adapter
- **Persistent Storage**: Chat history saved in MySQL database
- **Auto Device Registration**: Automatic device ID generation using Faker.js
- **Broadcast Messaging**: Send messages to all connected devices
- **Chat History**: Load previous messages on connection
- **Connection Management**: Track user connections and disconnections
- **Web Interface**: Modern responsive chat UI with AngularJS and Bootstrap
- **Cross-Platform**: Compatible with web browsers and Android app

## 🏗️ Architecture

```
┌─────────────┐         ┌─────────────┐
│   Client 1  │         │   Client 2  │
└──────┬──────┘         └──────┬──────┘
       │                       │
       └───────┬───────────────┘
               │ WebSocket
       ┌───────▼───────┐
       │  Socket.IO    │
       │    Server     │
       └───┬───────┬───┘
           │       │
   ┌───────▼──┐ ┌──▼───────┐
   │  MySQL   │ │  Redis   │
   │ Database │ │ Pub/Sub  │
   └──────────┘ └──────────┘
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MySQL** (v5.7 or higher)
- **Redis** (v5.0 or higher)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EchoWave
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=echowave_db
   DB_PORT=3306

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # Server Configuration
   PORT=3000
   ```

4. **Start MySQL and Redis services**
   
   **Windows:**
   ```bash
   # Start MySQL
   net start MySQL80

   # Start Redis
   redis-server
   ```

   **Linux/macOS:**
   ```bash
   # Start MySQL
   sudo service mysql start

   # Start Redis
   redis-server
   ```

5. **Database initialization**
   
   The database and tables will be created automatically on first run. The server will:
   - Create the `echowave_db` database (if it doesn't exist)
   - Create the `users` table
   - Create the `messages` table

## ⚙️ Configuration

### Database Configuration (`config/database.js`)

MySQL connection pool configuration:
- Connection limit: 10
- Wait for connections: enabled
- Queue limit: 0 (unlimited)

### Redis Configuration (`config/redis.js`)

Redis pub/sub clients for multi-server messaging:
- Publisher client for sending messages
- Subscriber client for receiving messages

## 🎯 Running the Server

### Development Mode

```bash
npm start
```

The server will start on `http://localhost:3000`

### Production Mode

```bash
NODE_ENV=production npm start
```

### Using PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start the server
pm2 start bin/www --name echowave

# Monitor
pm2 monit

# Logs
pm2 logs echowave

# Restart
pm2 restart echowave

# Stop
pm2 stop echowave
```

## 📡 API Documentation

### WebSocket Events

#### Client → Server

**1. register**
- **Description**: Register a new device or authenticate existing device
- **Payload**:
  ```javascript
  {
    deviceId: string | null,    // null for new device
    deviceName: string | null   // Optional device name
  }
  ```
- **Response**:
  ```javascript
  {
    success: boolean,
    deviceId: string,
    deviceName: string,
    history: Array<Message>     // Recent chat history
  }
  ```

**2. send_message**
- **Description**: Send a message to specific device or broadcast to all
- **Payload**:
  ```javascript
  {
    message: string,
    receiverDeviceId: string | null  // null for broadcast
  }
  ```
- **Response**:
  ```javascript
  {
    success: boolean,
    messageId: number,
    error?: string
  }
  ```

**3. typing** (Optional)
- **Description**: Notify when user is typing
- **Payload**:
  ```javascript
  {
    isTyping: boolean
  }
  ```

#### Server → Client

**1. new_message**
- **Description**: Receive new message from another user
- **Payload**:
  ```javascript
  {
    id: number,
    message: string,
    senderDeviceId: string,
    senderName: string,
    receiverDeviceId: string | null,
    timestamp: string,
    isBroadcast: boolean
  }
  ```

**2. user_connected**
- **Description**: Notification when a user connects
- **Payload**:
  ```javascript
  {
    deviceId: string,
    deviceName: string
  }
  ```

**3. user_disconnected**
- **Description**: Notification when a user disconnects
- **Payload**:
  ```javascript
  {
    deviceId: string,
    deviceName: string
  }
  ```

**4. typing_status** (Optional)
- **Description**: User typing status
- **Payload**:
  ```javascript
  {
    deviceId: string,
    deviceName: string,
    isTyping: boolean
  }
  ```

### HTTP Routes

**GET /**
- Home page
- Returns: Express welcome page

**GET /chat**
- Web chat interface
- Returns: Interactive chat UI with AngularJS

## 🌐 Web Client

The web interface is built with:
- **AngularJS** v1.8.2 - MVC framework
- **Bootstrap** v5.3.8 - UI styling
- **Toastr** v2.1.4 - Notifications
- **Socket.IO Client** - WebSocket connection

### Features:
- ✅ Real-time message sending/receiving
- ✅ Bootstrap-styled responsive design
- ✅ Connection status indicator
- ✅ Message history display
- ✅ Sender name badges
- ✅ Timestamp formatting
- ✅ Toast notifications for events

### Accessing the Web Client:

1. Start the server
2. Open browser and navigate to: `http://localhost:3000/chat`

## 📱 Android Client

The Android companion app (`Demo_Websocket`) provides:

### Features:
- ✅ Socket.IO Android client integration
- ✅ Room database for local message persistence
- ✅ RecyclerView with custom message adapters
- ✅ LiveData and ViewModel architecture
- ✅ Automatic reconnection handling
- ✅ Device ID storage in SQLite

### Technologies:
- Socket.IO Client Android v2.1.0
- Room Database v2.6.1
- ViewModel & LiveData
- RecyclerView

## 🗄️ Database Schema

### `users` Table

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `messages` Table

```sql
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_device_id VARCHAR(255) NOT NULL,
    receiver_device_id VARCHAR(255),
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_broadcast BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_device_id) REFERENCES users(device_id),
    FOREIGN KEY (receiver_device_id) REFERENCES users(device_id)
);
```

## 📁 Project Structure

```
EchoWave/
├── bin/
│   └── www                    # Server entry point
├── config/
│   ├── database.js           # MySQL configuration
│   └── redis.js              # Redis pub/sub setup
├── public/
│   ├── images/               # Static images
│   ├── javascripts/          # Client-side JS
│   └── stylesheets/
│       └── style.css         # Custom styles
├── routes/
│   ├── index.js              # Main routes
│   └── users.js              # User routes
├── socket/
│   └── socketHandler.js      # Socket.IO event handlers
├── views/
│   ├── chat.ejs              # Chat interface
│   ├── error.ejs             # Error page
│   └── index.ejs             # Home page
├── .env                       # Environment variables
├── app.js                     # Express app configuration
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🛠️ Technologies

### Backend
- **Node.js** - Runtime environment
- **Express.js** v4.16.1 - Web framework
- **Socket.IO** v4.8.1 - WebSocket library
- **MySQL2** v3.15.3 - Database driver
- **Redis** v5.9.0 - In-memory data store
- **@socket.io/redis-adapter** v8.3.0 - Multi-server support
- **@faker-js/faker** v10.1.0 - Fake data generation
- **dotenv** v16.4.7 - Environment variables
- **EJS** v2.6.1 - Template engine

### Frontend
- **AngularJS** v1.8.2 - JavaScript framework
- **Bootstrap** v5.3.8 - CSS framework
- **jQuery** v3.7.1 - DOM manipulation
- **Toastr** v2.1.4 - Notification library
- **Socket.IO Client** - Real-time communication

### Android
- **Socket.IO Android Client** v2.1.0
- **Room** v2.6.1 - Local database
- **Gson** v2.10.1 - JSON parsing

## 🔧 Development

### Adding New Socket Events

1. Add event handler in `socket/socketHandler.js`:
   ```javascript
   socket.on('your_event', async (data, callback) => {
       // Handle event
       callback({ success: true });
   });
   ```

2. Update client code to emit/listen for the event

### Database Migrations

To modify the database schema:

1. Update table definitions in `config/database.js`
2. Restart the server (or manually run SQL migrations)

### Adding Routes

Add new routes in `routes/index.js`:
```javascript
router.get('/your-route', function(req, res, next) {
    res.render('your-view', { title: 'Your Title' });
});
```

## 🧪 Testing

### Manual Testing

1. Start the server
2. Open multiple browser tabs at `http://localhost:3000/chat`
3. Send messages and verify they appear in all tabs
4. Check MySQL database for stored messages
5. Test Android app connectivity

### Useful Commands

```bash
# Check MySQL database
mysql -u root -p
USE echowave_db;
SELECT * FROM users;
SELECT * FROM messages;

# Check Redis connections
redis-cli
PING
CLIENT LIST
```

## 🚨 Troubleshooting

### Common Issues

**1. "Cannot connect to MySQL"**
- Ensure MySQL service is running
- Verify credentials in `.env` file
- Check if port 3306 is available

**2. "Redis connection failed"**
- Start Redis server: `redis-server`
- Verify Redis is running: `redis-cli PING`
- Check REDIS_HOST and REDIS_PORT in `.env`

**3. "Port 3000 already in use"**
- Change PORT in `.env` file
- Or kill the process using port 3000:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F

  # Linux/macOS
  lsof -ti:3000 | xargs kill -9
  ```

**4. "Socket.IO connection failed"**
- Check if server is running
- Verify WebSocket URL in client code
- Check firewall settings
- Ensure CORS is properly configured

## 📊 Performance

### Optimization Tips

1. **Use PM2 for clustering**:
   ```bash
   pm2 start bin/www -i max
   ```

2. **Enable Redis persistence**:
   - Configure `redis.conf` for RDB or AOF

3. **MySQL indexes**:
   - Indexes are already on `device_id` and foreign keys
   - Add composite indexes if needed

4. **Connection pooling**:
   - Adjust `connectionLimit` in `config/database.js`

## 🔐 Security Considerations

- Use environment variables for sensitive data
- Implement authentication/authorization
- Validate and sanitize user input
- Use HTTPS in production
- Enable Redis authentication
- Restrict MySQL user permissions
- Implement rate limiting
- Add CORS whitelist for production

## 📝 License

This project is licensed under the MIT License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Made with ❤️ using Node.js, Socket.IO, and Redis**
