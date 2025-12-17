var express = require('express');
var router = express.Router();

var postController = require('../controller/postController');
var authenticateToken = require("../middlewares/auth");

router.post('/create', authenticateToken, postController.uploadMedia, postController.createPost);
router.delete('/delete/:postId', authenticateToken, postController.deletePost);
router.post('/:postId/like', authenticateToken, postController.likePost);
router.get('/:postId/comments', authenticateToken, postController.getComments);
router.post('/:postId/comment', authenticateToken, postController.addComment);
router.delete('/comment/:commentId', authenticateToken, postController.deleteComment);

/* get view post */
router.get('/view-post/:postId', authenticateToken, postController.viewPost);

module.exports = router;