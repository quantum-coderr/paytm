require("dotenv").config();
const jwt = require("jsonwebtoken");

function authMiddleware (req, res, next) {
    const token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Unauthorized access"
        });
    }

    const tokenVal = token.split(' ')[1];

    try {
        const decoded = jwt.verify(tokenVal, process.env.JWT_SECRET);
        req.userID = decoded.userID; 
        next();
    } catch (error) {
        return res.status(403).json({
            message: "Invalid token"
        });
    }
}

module.exports = {
    authMiddleware 
};