const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "rehan8080";

/**
 * Optional authentication middleware.
 * If a valid token is provided, req.user and res.locals.user are populated.
 * If no token or an invalid token is provided, req.user remains undefined, but the request continues.
 */
function optionalAuthenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];

    if (!token && req.cookies) {
        token = req.cookies.token;
    }

    if (!token) {
        // Proceed without setting req.user
        return next();
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        res.locals.user = decoded; // Ensure res.locals is populated for views
        next();
    } catch (err) {
        // If token is invalid/expired, pretend it wasn't provided and proceed
        return next();
    }
}

module.exports = optionalAuthenticateToken;
