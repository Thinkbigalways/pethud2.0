var express = require('express');
var router = express.Router();

var postController = require('../controller/postController');
var authenticateToken = require("../middlewares/auth");

// Get upload URL for direct client uploads (for Vercel compatibility)
router.get('/upload-url', authenticateToken, postController.getUploadUrl);

// Create post: support both client-side uploads (mediaUrls) and server-side uploads (files)
router.post('/create', authenticateToken, function(req, res, next) {
  // If mediaUrls are provided, skip multer (client-side uploads)
  if (req.body.mediaUrls) {
    return postController.createPost(req, res, next);
  }
  // Otherwise, use multer for server-side uploads (legacy, local dev)
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