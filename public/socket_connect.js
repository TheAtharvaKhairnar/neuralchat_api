let socket;
let currentChannel;

function connect(){
    const token=document.getElementById('token').value.trim();
    const channelId=document.getElementById('channelId').value.trim();

    if(!token){
        document.getElementById('error').textContent="Please enter your JWT Token";
        document.getElementById('error').style.display='block';
        return;
    }
    currentChannel=channelId;
    socket=io({
        auth:{token:localStorage.getItem('token') }
    });
    socket.on('connect',()=>{
        document.getElementById('status').textContent='Connected';
        document.getElementById('status').style.background='#10b981';
        addSystemMessage("Connected to Server");
        socket.emit('join_channel',currentChannel);
        addSystemMessage(`Joined channel: ${currentChannel}`);
        document.getElementById('setup').style.display='none';
        document.getElementById('chatArea').style.display='block';
    });
    socket.on('connect_error',(error)=>{
        document.getElementById('error').textContent=`Connection failed: ${error.message}`;
        document.getElementById('error').style.display='block';
    });
    socket.on('new_message',(msg)=>{
        addMessage(msg.username,msg.content,new Date(msg.created_at));
    });
    socket.on('user_joined',(data)=>{
        addSystemMessage(`${data.username} joined the channel`);
    });
    socket.on('user_left',(data)=>{
        addSystemMessage(`${data.username} left the channel`);
    });
    socket.on('user_typing',(data)=>{
        document.getElementById('messageInput').addEventListener('input',()=>{
            socket.emit('typing',{username: myUsername});
        });
        document.getElementById('typing').textContent=`${data.username} is typing..`;
        setTimeout(()=>{
            document.getElementById('typing').textContent='';
        },3000);
    });
    socket.on('disconnect',()=>{
        document.getElementById('status').textContent='Disconnected';
        document.getElementById('status').style.background='rgba(255,255,255,0.2)';
        addSystemMessage("Disconnected from server");
    });
}
function sendMessage(){
    const input=document.getElementById('messageInput');
    const content=input.value.trim();

    if(!content){ return; }
    socket.emit('send_message',{
        channelId: currentChannel, content
    });
    input.value='';
}
function addMessage(username,content,time){
    const div=document.createElement('div');
    div.className='message';
    div.innerHTML=`
    <span class="username">${username}:</span>${content}
    <span class="time">${time.toLocaleTimeString()}</span>
    `;
    document.getElementById('messages').appendChild(div);
    document.getElementById('messages').scrollTop=document.getElementById('messages').scrollHeight;   
}
function addSystemMessage(text){
    const div=document.createElement('div');
    div.className='system-message';
    div.textContent=text;
    document.getElementById('messages').appendChild(div);
}
document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('messageInput').addEventListener('keypress',(e)=>{
        if(e.key==='Enter') sendMessage();
    });
});