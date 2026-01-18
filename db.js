const {Pool}=require('pg');
const pool=new Pool({
    connectionString: process.env.DATABASE_URL||'postgresql://postgres:yourpassword@localhost:5432/chatapp',
    ssl: process.env.DATABASE_URL?{rejectUnauthorized:false}:false
});
module.exports=pool;