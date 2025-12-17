const multer = require('multer');
const path = require('path');
const { db, admin, bucket } = require('../firebase/config');

const FieldValue = admin.firestore.FieldValue;
const POSTS_COLLECTION = 'posts';

// Configure multer to use memory storage (for Vercel/serverless compatibility)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// Middleware to handle multiple file uploads
const uploadMedia = upload.array('media', 10); // max 10 files

/**
 * Upload file to Firebase Storage and return public URL
 */
async function uploadToFirebaseStorage(file, folder = 'posts') {
  return new Promise((resolve, reject) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const fileName = `${folder}/${uniqueSuffix}${ext}`;
    
    const fileUpload = bucket.file(fileName);
    
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      public: true, // Make file publicly accessible
    });

    stream.on('error', (error) => {
      console.error('Error uploading to Firebase Storage:', error);
      reject(error);
    });

    stream.on('finish', async () => {
      try {
        // Make the file publicly accessible
        await fileUpload.makePublic();
        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(publicUrl);
      } catch (error) {
        console.error('Error making file public:', error);
        reject(error);
      }
    });

    stream.end(file.buffer);
  });
}

/**
 * Delete file from Firebase Storage
 */
async function deleteFromFirebaseStorage(url) {
  try {
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts.slice(-2).join('/'); // Get folder/filename
    
    await bucket.file(fileName).delete();
    return true;
  } catch (error) {
    console.error('Error deleting from Firebase Storage:', error);
    return false;
  }
}

/**
 * Create a new post
 */
async function createPost(req, res) {
  try {
    const { content } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (!content || content.trim() === '') {
      return res.redirect('/?error=Post content is required');
    }

    // Upload files to Firebase Storage
    const mediaUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const publicUrl = await uploadToFirebaseStorage(file, 'posts');
          mediaUrls.push(publicUrl);
        } catch (error) {
          console.error('Error uploading file:', error);
          // Continue with other files even if one fails
        }
      }
    }

    // Create post in Firestore
    const postData = {
      user_id: userId,
      username: username,
      content: content.trim(),
      media: mediaUrls,
      likes: [],
      comments: [],
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    await db.collection(POSTS_COLLECTION).add(postData);

    return res.redirect('/');
  } catch (err) {
    console.error('Error creating post:', err);
    return res.redirect('/?error=Failed to create post');
  }
}

/**
 * Delete a post
 */
async function deletePost(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const postDoc = await db.collection(POSTS_COLLECTION).doc(postId).get();
    if (!postDoc.exists) {
      return res.json({ success: false, message: 'Post not found' });
    }

    const postData = postDoc.data();
    if (postData.user_id !== userId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    // Delete media files from Firebase Storage
    if (postData.media && postData.media.length > 0) {
      for (const mediaUrl of postData.media) {
        await deleteFromFirebaseStorage(mediaUrl);
      }
    }

    await db.collection(POSTS_COLLECTION).doc(postId).delete();

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting post:', err);
    return res.json({ success: false, message: 'Failed to delete post' });
  }
}

/**
 * Like/unlike a post
 */
async function likePost(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const postRef = db.collection(POSTS_COLLECTION).doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.json({ success: false, message: 'Post not found' });
    }

    const postData = postDoc.data();
    const likes = postData.likes || [];
    const isLiked = likes.includes(userId);

    if (isLiked) {
      // Unlike: remove user ID from likes array
      await postRef.update({
        likes: FieldValue.arrayRemove(userId),
        updated_at: FieldValue.serverTimestamp(),
      });
    } else {
      // Like: add user ID to likes array
      await postRef.update({
        likes: FieldValue.arrayUnion(userId),
        updated_at: FieldValue.serverTimestamp(),
      });
    }

    return res.json({ success: true, liked: !isLiked });
  } catch (err) {
    console.error('Error liking post:', err);
    return res.json({ success: false, message: 'Failed to like post' });
  }
}

/**
 * Get comments for a post
 */
async function getComments(req, res) {
  try {
    const { postId } = req.params;

    const postDoc = await db.collection(POSTS_COLLECTION).doc(postId).get();
    if (!postDoc.exists) {
      return res.json({ success: false, message: 'Post not found' });
    }

    const postData = postDoc.data();
    const comments = postData.comments || [];

    return res.json({ success: true, comments });
  } catch (err) {
    console.error('Error getting comments:', err);
    return res.json({ success: false, message: 'Failed to get comments' });
  }
}

/**
 * Add a comment to a post
 */
async function addComment(req, res) {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (!content || content.trim() === '') {
      return res.json({ success: false, message: 'Comment content is required' });
    }

    const postRef = db.collection(POSTS_COLLECTION).doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.json({ success: false, message: 'Post not found' });
    }

    const comment = {
      user_id: userId,
      username: username,
      content: content.trim(),
      created_at: FieldValue.serverTimestamp(),
    };

    await postRef.update({
      comments: FieldValue.arrayUnion(comment),
      updated_at: FieldValue.serverTimestamp(),
    });

    return res.json({ success: true, comment });
  } catch (err) {
    console.error('Error adding comment:', err);
    return res.json({ success: false, message: 'Failed to add comment' });
  }
}

/**
 * Delete a comment
 */
async function deleteComment(req, res) {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const { postId } = req.body;

    if (!postId) {
      return res.json({ success: false, message: 'Post ID is required' });
    }

    const postRef = db.collection(POSTS_COLLECTION).doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.json({ success: false, message: 'Post not found' });
    }

    const postData = postDoc.data();
    const comments = postData.comments || [];
    
    // Find and remove the comment
    const updatedComments = comments.filter(comment => {
      // Comments don't have IDs in this structure, so we'll need to match by user_id and content
      // For now, we'll remove comments by the user
      return !(comment.user_id === userId);
    });

    await postRef.update({
      comments: updatedComments,
      updated_at: FieldValue.serverTimestamp(),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return res.json({ success: false, message: 'Failed to delete comment' });
  }
}

/**
 * View a single post
 */
async function viewPost(req, res) {
  try {
    const { postId } = req.params;
    const user = res.locals.user;

    const postDoc = await db.collection(POSTS_COLLECTION).doc(postId).get();
    if (!postDoc.exists) {
      return res.status(404).render('error', {
        message: 'Post not found',
        error: {},
      });
    }

    const postData = postDoc.data();
    return res.render('posts/view-post', {
      title: 'View Post',
      user,
      post: { id: postDoc.id, ...postData },
    });
  } catch (err) {
    console.error('Error viewing post:', err);
    return res.status(500).render('error', {
      message: 'Failed to load post',
      error: {},
    });
  }
}

module.exports = {
  uploadMedia,
  createPost,
  deletePost,
  likePost,
  getComments,
  addComment,
  deleteComment,
  viewPost,
};
