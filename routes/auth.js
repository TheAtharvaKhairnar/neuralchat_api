const express=require("express");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const pool=require("../db");
const {JWT_SECRET}=require("../middleware/auth");

const router=express.Router();
router.post('/register',async(req,res)=>{
    try{
        const {username,password}=req.body;
        if(!username||!password){
            return res.status(400).json({error:"Username and password required"});
        }
        if(username.length<3||username.length>50){
            return res.status(400).json({error:"Username must be of 3-50 characters"});
        }
        if(password.length<6){
            return res.status(400).json({error:"Password of minimum 6 characters"});
        }
        const hashPass=await bcrypt.hash(password,10);
        const result=await pool.query(
            'INSERT INTO users(username,password_hash) VALUES ($1,$2) RETURNING id, username, created_at',
            [username,hashPass]
        );
        const user=result.rows[0];
        const token=jwt.sign(
            {
                userId: user.id,
                username:user.username
            },
            JWT_SECRET,
            { expiresIn: '7d'}
        );
        res.status(201).json({
            message: "User registered successfully",
            user:{
            id: user.id,
            username: user.username,
            created_at: user.created_at
            }, token});
    } catch(error){
        if(error.code==='23505'){
            return res.status(409).json({error:"Username already exists"});
        }
        console.error("Error encountered:" ,error.message);
        res.status(500).json({error:"Server error"});
    }
});

router.post('/login',async(req,res)=>{
    try{
        const {username,password}=req.body;
        if(!username||!password){
            return res.status(400).json({error:"Username and Password required"});
        }
        const result=await pool.query(
            'SELECT * FROM users WHERE username=$1',
            [username]
        );
        if(result.rows.length===0){
            return res.status(401).json({error:"Invalid Username and Password"});
        }
        const user=result.rows[0];
        const validPass=await bcrypt.compare(password,user.password_hash);
        if(!validPass){
            return res.status(401).json({error:"Invalid Password"});
        }
        const token=jwt.sign(
            {
                userId:user.id,
                username:user.username
            }, JWT_SECRET,
            { expiresIn: '7d'}
        );
        res.json({
            message:"Logged-in successfully",
            user:
            {
                userId:user.id,
                username:user.username,
                created_at:user.created_at
            }, token
        });
    } catch(error){
        console.error("Login Error: ",error.message);
        res.status(500).json({error:'Server error'});
    }
});

module.exports=router;