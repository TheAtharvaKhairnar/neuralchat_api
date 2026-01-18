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
app.use(cors());

app.get("/",(req,res)=>{
    res.json({message:"NeuralChat API Server"});
});
io.on('connection',(socket)=>{
    console.log("New client connected: ",socket.id);
    socket.on('disconnect',()=>{
        console.log("Client disconnected: ",socket.id);
    });
});
server.listen(PORT,()=>{
    console.log(`Server running on PORT ${PORT}`);
});

