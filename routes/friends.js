var express = require('express');
var router = express.Router();

var friendsController = require('../controller/friendsController');
var authenticateToken = require("../middlewares/auth");

router.post('/request', authenticateToken, friendsController.sendRequest);
router.post('/accept', authenticateToken, friendsController.acceptRequest);
router.post('/cancel', authenticateToken, friendsController.cancelRequest);
router.post('/remove', authenticateToken, friendsController.removeFriend);
router.get('/list', authenticateToken, friendsController.listFriends);
router.get('/pending', authenticateToken, friendsController.pendingRequests);

module.exports = router;