const {Pool}=require('pg');
const pool=new Pool({
    connectionString: process.env.DATABASE_URL||'postgresql://postgres:root@localhost:5432/neuralchat',
    ssl: process.env.DATABASE_URL?{rejectUnauthorized:false}:false,
    options:"-c search_path=neural_chat,public"
});
module.exports=pool;