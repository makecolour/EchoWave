const { createClient } = require('redis');
require('dotenv').config();

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
};

if (process.env.REDIS_PASSWORD) {
    redisConfig.password = process.env.REDIS_PASSWORD;
}

// Create Redis client for pub/sub
const pubClient = createClient({
    socket: {
        host: redisConfig.host,
        port: redisConfig.port
    },
    password: redisConfig.password
});

const subClient = pubClient.duplicate();

pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));

async function connectRedis() {
    try {
        await pubClient.connect();
        await subClient.connect();
        console.log('Redis clients connected successfully');
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        throw error;
    }
}

module.exports = { pubClient, subClient, connectRedis };
