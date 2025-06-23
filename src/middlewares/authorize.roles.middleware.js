const authorizeRoles=(...allowedRoles)=>{
    return(req,res,next)=>{
        if(!req.user||!allowedRoles.includes(req.user.role)){
            return res.status(400).json({message:"Forbidden:Access denied"})
        }
        next();
    }
}
export default authorizeRoles