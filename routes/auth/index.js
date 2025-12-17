var express = require('express');
var router = express.Router();
var authenticateToken = require("../../middlewares/auth");
var redirectIfAuthenticated = require("../../middlewares/redirectIfAuthenticated");
var authController = require("./authController");

/* GET /auth/login */
router.get('/login', redirectIfAuthenticated, authController.login);

/* POST /auth/login */
router.post('/login', authController.doLogin);

/* GET /auth/register */
router.get('/register', redirectIfAuthenticated, authController.register);

/* POST /auth/register */
router.post('/register', authController.doRegister);

/* Get check username */
router.get("/check-username", authController.checkUsername);

/* GET /auth/forgot-password */
router.get('/forgot-password', redirectIfAuthenticated, authController.forgotPassword);

/* POST /auth/forgot-password */
router.post('/forgot-password', authController.doForgotPassword);

/* GET /auth/reset-password */
router.get('/reset-password', redirectIfAuthenticated, authController.resetPasswordPage);

/* POST /auth/reset-password */
router.post('/reset-password', authController.doResetPassword);

/* GET /auth/logout */
router.get('/logout', authController.logout);

module.exports = router;
