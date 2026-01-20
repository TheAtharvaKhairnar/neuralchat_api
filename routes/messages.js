const express=require("express");
const pool=require("../db");
const {authMiddleware}=require("../middleware/auth");
const router=express.Router();
console.log("authMiddleware: ",typeof authMiddleware);
router.use(authMiddleware);

router.get('/channel/:channelId',async (req,res)=>{
    try{
        const channelId=parseInt(req.params.channelId);
        const limit=parseInt(req.query.limit)||50;
        const offset=parseInt(req.query.offset)||0;
        if(isNaN(channelId)){
            return res.status(400).json({error:"Invalid channel ID"});
        }
        const channelCheck = await pool.query(
            `SELECT id 
            FROM channels 
            WHERE id=$1`,
            [channelId]
        );
        if(channelCheck.rows.length===0){
            return res.status(401).json({error:"Invalid Channel ID"});
        }
        const result=await pool.query(
            `SELECT m.id,m.channel_id,m.user_id,m.content,m.created_at,u.username
            FROM messages m
            JOIN users u ON m.user_id=u.id
            WHERE m.channel_id=$1
            ORDER BY m.created_at ASC
            LIMIT $2 OFFSET $3`,
            [channelId,limit,offset]
        );
        const countResult=await pool.query(
            `SELECT COUNT(*)
            FROM messages
            WHERE channel_id=$1`,
            [channelId]
        );
        res.json({
            messages: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit,
            offset
       });
    } catch(error){
        console.error("Error encountered: ",error.message);
        res.status(500).json({error:"Server Error"});
    }
});

module.exports=router;