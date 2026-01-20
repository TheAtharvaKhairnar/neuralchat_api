const jwt=require("jsonwebtoken");
const JWT_SECRET=process.env.JWT_SECRET||'change-this-secret-in-production-12345';
const authMiddleware=(req,res,next)=>{
    const authHeader=req.headers.authorization;
    if(!authHeader){
        return res.status(401).json({error:"No authorization header"});
    }
    const token=authHeader.split(' ')[1];
    if(!token){
        return res.status(401).json({error: "No token provided"});
    }
    try
    {
        const decoded=jwt.verify(token,JWT_SECRET);
        req.userId=decoded.userId;
        req.username=decoded.username;
        next();
    } catch(error){
        return res.status(401).json({error:"Invalid/expired token"});
    }
};
module.exports={authMiddleware, JWT_SECRET};