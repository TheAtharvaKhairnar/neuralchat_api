const express=require("express");
const pool=require("../db");
const {authMiddleware}=require("../middleware/auth");
const router=express.Router();
router.use(authMiddleware);

router.post('/',async (req,res)=>{
    try{
        const {name,description}=req.body;
        if(!name){
            return res.status(401).json({error: "Incorrect channel name"});
        }
        if(name.length<2||name.length>100){
            return res.status(400).json({error:"Channel name must be 2-100 characters long"});
        }
        const result=await pool.query(
            `INSERT INTO channels(name,description,created_by) VALUES($1,$2,$3) RETURNING *`,
            [name,description||null,req.userId]
        );
        res.status(201).json({
            message:"Channel created successfully",
            channel:result.rows[0]
        });
    } catch(error){
        if(error.code==='23505'){
            return res.status(409).json({error:"Channel name already exists"});
        }
        console.error("Create channel error ",error.message);
        res.status(500).json({error:"Server Error"});
    }
});

router.get('/',async (req,res)=>{
    try{
        const result=await pool.query(
            `SELECT c.*.username as creator_name
            FROM channels c
            LEFT JOIN users u ON c.created_by=u.id
            ORDER BY c.created_at DESC`
        );
        res.json({
            channels: result.rows,
            count: result.rows.length
        });
    } catch(error){
        console.error("GET Channels Error: ",error.message);
        res.status(500).json({error:"Server Error"});
    }
});

router.get('/:id',async (req,res)=>{
    try{
        const id=parseInt(req.params);
        if(isNaN(id)){
            return res.status(400).json({error:"Invalid channel ID"});
        }
        const result=await pool.query(
            `SELECT c.id,c.name,c.description,c.created_by,c.created_at,u.username as creator_name
            FROM channels c
            LEFT JOIN users u ON c.created_by=u.id
            WHERE c.id=$1`,
            [id]
        );
        if(result.rows.length===0){
            return res.status(404).json({error:"Channel not found"});
        }
        res.json({channel:result.rows[0]});
    } catch(error){
        console.error("Channel error: ",error.message);
        res.status(500).json({error:"Server Error"});
    }
});

module.exports=router;