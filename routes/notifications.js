const express = require('express');
const router = express.Router();
const notificationsController = require('../controller/notificationsController');
const authenticateToken = require('../middlewares/auth');

// ================= Notifications Routes =================
router.get('/', authenticateToken, notificationsController.showNotificationsPage);
router.post('/read', authenticateToken, notificationsController.markAsRead);
router.post('/read-all', authenticateToken, notificationsController.markAllAsRead);
router.get('/fetch', authenticateToken, notificationsController.fetchNotifications);

module.exports = router;
