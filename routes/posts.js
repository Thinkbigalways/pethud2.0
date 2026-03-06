var express = require('express');
var router = express.Router();

var postController = require('../controller/postController');
var authenticateToken = require("../middlewares/auth");
var optionalAuthenticateToken = require("../middlewares/optionalAuth");

// Get upload URL for direct client uploads (for Vercel compatibility)
router.get('/upload-url', authenticateToken, postController.getUploadUrl);

// Create post: support both client-side uploads (mediaUrls) and server-side uploads (files)
router.post('/create', authenticateToken, function (req, res, next) {
  // If mediaUrls are provided, skip multer (client-side uploads)
  if (req.body.mediaUrls) {
    return postController.createPost(req, res, next);
  }
  // Otherwise, use multer for server-side uploads (legacy, local dev)
  postController.uploadMedia(req, res, function (err) {
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
// Comments can be viewed publicly
router.get('/:postId/comments', optionalAuthenticateToken, postController.getComments);
router.post('/:postId/comment', authenticateToken, postController.addComment);
router.delete('/comment/:commentId', authenticateToken, postController.deleteComment);

/* get view post */
// Post view needs optional token so public users can view post
router.get('/view-post/:postId', optionalAuthenticateToken, postController.viewPost);
router.post('/:postId/share', authenticateToken, postController.sharePost);

// Pagination API for infinite scroll
router.get('/api-feed', optionalAuthenticateToken, postController.getFeedPosts);

module.exports = router;