const jwt = require("jsonwebtoken");
const pool = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

function setupChatSocket(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication Error: No token provided'));
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        socket.on('join_channel', (channelId) => {
            socket.join(`channel_${channelId}`);
            socket.to(`channel_${channelId}`).emit('user_joined', {
                username: socket.username,
                channelId,
                timestamp: new Date()
            });
        });

        socket.on('leave_channel', (channelId) => {
            socket.leave(`channel_${channelId}`);
            socket.to(`channel_${channelId}`).emit('user_left', {
                username: socket.username,
                channelId,
                timestamp: new Date()
            });
        });

        socket.on('send_message', async ({ channelId, content }) => {
            try {
                if (!content || content.trim().length === 0) {
                    socket.emit('error', { message: 'Message content cannot be empty' });
                    return;
                }

                const result = await pool.query(
                    'INSERT INTO messages(channel_id, user_id, content) VALUES($1, $2, $3) RETURNING *',
                    [channelId, socket.userId, content]
                );

                const message = {
                    ...result.rows[0],
                    username: socket.username
                };

                io.to(`channel_${channelId}`).emit('new_message', message);
            } catch (error) {
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('typing_start', ({ channelId }) => {
            socket.to(`channel_${channelId}`).emit('user_typing', {
                username: socket.username,
                channelId
            });
        });

        socket.on('typing_stop', ({ channelId }) => {
            socket.to(`channel_${channelId}`).emit('user_stopped_typing', {
                username: socket.username,
                channelId
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.username} (ID:${socket.id})`);
        });
    });
}

module.exports = setupChatSocket;