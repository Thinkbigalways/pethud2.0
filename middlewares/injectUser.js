const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "rehan8080";

function injectUser(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (token) {
    try {
      res.locals.user = jwt.verify(token, SECRET_KEY); // available in all EJS views
    } catch (err) {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
}

module.exports = injectUser;
