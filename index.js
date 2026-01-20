const express=require("express");
const app=express();
const http=require('http');
const socketIo=require('socket.io');
const cors=require('cors');
require('dotenv').config();
const PORT=process.env.PORT||3001;
const server=http.createServer(app);
const io=socketIo(server,{
    cors:{
        origin:"*",
        methods:["GET","POST"]
    }
});
const path=require("path");
app.use(express.json());
app.use(express.static("public"));
app.use(cors({ origin:"*", credentials: true}));
const authRoutes=require("./routes/auth");
const channelRoutes=require("./routes/channels");
const messageRoutes=require("./routes/messages");
console.log('Auth routes loaded: ', typeof authRoutes);
app.use('/api/auth',authRoutes);
app.use('/api/channels',channelRoutes);
app.use('/api/messages',messageRoutes);

app.get("/",(req,res)=>{
    res.json({
        message:"NeuralChat API Server",
        version:'1.0.0',
        endpoints:{
            auth:{
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login'
            },
            channels:{
                create: 'POST /api/channels (requires auth)',
                list: 'GET /api/channels (requires auth)',
                get: 'GET /api/channels/:id (requires auth)'
            },
            messages:{
                history: 'GET /api/messages/channel/:channelId '
            },
            websocket:{
                connect: 'ws://localhost:3001 (coming soon)'
            }
        }
    });
});
const setupChatSocket=require('./socket/chat');
setupChatSocket(io);
server.listen(PORT,()=>{
    console.log(`Neural Chat API running on PORT ${PORT}`);
});

