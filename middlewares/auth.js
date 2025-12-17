const jwt = require("jsonwebtoken");
const SECRET_KEY = "rehan8080";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  if (!token && req.cookies) {
    token = req.cookies.token;
  }

  if (!token) {
    //return res.status(401).json({ error: "Access denied. No token provided." });
    return res.redirect('/auth/login');
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    //res.status(403).json({ error: "Invalid token." });
    return res.redirect('/auth/login');
  }
}

module.exports = authenticateToken;
