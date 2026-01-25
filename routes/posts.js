var express = require('express');
var router = express.Router();

var postController = require('../controller/postController');
var authenticateToken = require("../middlewares/auth");

// Create post: wrap multer so upload errors are caught and shown as redirect (not 500)
router.post('/create', authenticateToken, function(req, res, next) {
  postController.uploadMedia(req, res, function(err) {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 50MB)' :
        err.code === 'LIMIT_FILE_COUNT' ? 'Too many files (max 10)' :
        (err.message || 'Error uploading files');
      return res.redirect('/?error=' + encodeURIComponent(msg));
    }
    postController.createPost(req, res, next);
  });
});
router.delete('/delete/:postId', authenticateToken, postController.deletePost);
router.post('/:postId/like', authenticateToken, postController.likePost);
router.get('/:postId/comments', authenticateToken, postController.getComments);
router.post('/:postId/comment', authenticateToken, postController.addComment);
router.delete('/comment/:commentId', authenticateToken, postController.deleteComment);

/* get view post */
router.get('/view-post/:postId', authenticateToken, postController.viewPost);

module.exports = router;