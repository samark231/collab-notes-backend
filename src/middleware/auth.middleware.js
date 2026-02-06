import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
    const token = req.cookies.jwt;
    // console.log("token is: ", token);
    if (!token) {
        return res.status(401).json({ success:false, data: null,message: "Not Authenticated!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
        if(!decoded){
            return res.status(401).json({ success:false, data: null,message:"Unauthorised: Invalid token"});
        }
        // console.log("decoded is: ",decoded);
        req.userId = decoded.userId;
        next();

    } catch (err) {
        console.error("Token Verification Failed:", err);
        return res.status(403).json({ success:false, data: null, message: "Token is not valid!" });
    }
};

export {
    verifyToken
}