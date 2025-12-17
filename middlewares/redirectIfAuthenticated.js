const jwt = require("jsonwebtoken");
const SECRET_KEY = "rehan8080";

function redirectIfAuthenticated(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (token) {
    try {
      jwt.verify(token, SECRET_KEY);
      return res.redirect('/home');
    } catch (err) {
      console.error("JWT verification failed:", err);
    }
  }

  next();
}

module.exports = redirectIfAuthenticated;
