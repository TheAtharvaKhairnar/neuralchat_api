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

        socket.on('send_message', ({ channelId, content }) => {
            if(!content || typeof content!== 'string' || content.trim().length===0){
                return socket.emit('error',{message:'Message content cannot be empty'});
            }
            const optimisticMessage={
                id:Date.now(),
                channel_id:channelId,
                user_id:socket.userId,
                username:socket.username,
                content:content,
                created_at:new Date().toISOString(),
                status:'sending'
            };

            io.to(`channel_${channelId}`).emit('new_message', optimisticMessage);
            pool.query(
                'INSERT INTO messages(channel_id,user_id,content) VALUES ($1,$2,$3) RETURNING *',
                [channelId,socket.userId,content]
            ).then((result)=>{
                socket.emit('message_confirmed',{
                    tempId:optimisticMessage.id,
                    dbId:result.rows[0].id,
                    message:"Message confirmed successfully"
                });
                console.log(`Message persisted with ID: ${result.rows[0].id}`);
            }).catch((error)=>{
                console.error("CRITICAL: Message persistence failed: ",error.message);
                socket.emit('message_error',{
                    tempId:optimisticMessage.id,
                    error:"Message failed to save"
                });
            });
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