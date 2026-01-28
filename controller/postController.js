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
 * Generate signed upload URL for direct client uploads (for Vercel compatibility)
 */
async function getUploadUrl(req, res) {
  try {
    const { fileName, contentType, fileSize } = req.query;
    
    if (!fileName || !contentType) {
      return res.json({ success: false, message: 'fileName and contentType are required' });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileSize && parseInt(fileSize) > maxSize) {
      return res.json({ 
        success: false, 
        message: `File size exceeds the maximum limit of ${(maxSize / 1024 / 1024).toFixed(0)}MB` 
      });
    }

    // Validate file type
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
    const ext = path.extname(fileName).toLowerCase().replace('.', '');
    if (!allowedTypes.test(ext)) {
      return res.json({ 
        success: false, 
        message: 'Invalid file type. Only images (JPEG, PNG, GIF, WEBP) and videos (MP4, MOV, AVI) are allowed.' 
      });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const storageFileName = `posts/${uniqueSuffix}.${ext}`;
    
    const file = bucket.file(storageFileName);
    
    // Generate a signed URL for upload (valid for 15 minutes)
    // Use resumable upload for better reliability with large files
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    });

    return res.json({ 
      success: true, 
      uploadUrl: url,
      fileName: storageFileName,
      publicUrl: `https://storage.googleapis.com/${bucket.name}/${storageFileName}`
    });
  } catch (err) {
    console.error('Error generating upload URL:', err);
    return res.json({ 
      success: false, 
      message: err.message || 'Failed to generate upload URL. Please try again.' 
    });
  }
}

/**
 * Create a new post (accepts mediaUrls from client-side uploads)
 */
async function createPost(req, res) {
  try {
    const { content, mediaUrls } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (!content || content.trim() === '') {
      return res.redirect('/?error=Post content is required');
    }

    // Handle legacy file uploads (for non-Vercel deployments)
    let finalMediaUrls = [];
    
    // Parse mediaUrls if it's a JSON string
    let parsedMediaUrls = null;
    if (typeof mediaUrls === 'string') {
      try {
        parsedMediaUrls = JSON.parse(mediaUrls);
      } catch (e) {
        // If parsing fails, treat as single URL
        parsedMediaUrls = mediaUrls ? [mediaUrls] : [];
      }
    } else if (Array.isArray(mediaUrls)) {
      parsedMediaUrls = mediaUrls;
    }
    
    if (parsedMediaUrls && parsedMediaUrls.length > 0) {
      // Client-side uploads: URLs are already provided
      finalMediaUrls = parsedMediaUrls.filter(url => url && url.trim() !== '');
    } else if (req.files && req.files.length > 0) {
      // Server-side uploads (legacy, for local dev)
      for (const file of req.files) {
        try {
          const publicUrl = await uploadToFirebaseStorage(file, 'posts');
          finalMediaUrls.push(publicUrl);
        } catch (error) {
          console.error('Error uploading file:', error);
          // Continue with other files even if one fails
        }
      }
    }

    // Make uploaded files public (if they were uploaded via signed URLs)
    if (finalMediaUrls.length > 0) {
      for (const url of finalMediaUrls) {
        try {
          // Extract file path from URL
          const urlParts = url.split('/');
          const filePath = urlParts.slice(-2).join('/'); // posts/filename.ext
          const fileRef = bucket.file(filePath);
          await fileRef.makePublic();
        } catch (error) {
          console.error('Error making file public:', error);
          // Continue even if making public fails
        }
      }
    }

    // Create post in Firestore
    const postData = {
      user_id: userId,
      username: username,
      content: content.trim(),
      media: finalMediaUrls,
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
    const rawComments = postData.comments || [];
    const currentUserId = req.user && req.user.id;

    // Normalise comment shape for the frontend JS in posts.ejs
    const comments = rawComments.map((c, index) => {
      const createdAt = c.created_at;
      let createdAtIso = null;
      if (createdAt) {
        // Firestore Timestamp -> ISO string
        if (typeof createdAt.toDate === 'function') {
          createdAtIso = createdAt.toDate().toISOString();
        } else {
          createdAtIso = createdAt;
        }
      }

      // For old comments without IDs, create a stable identifier using user_id + created_at
      // This allows us to find and delete them later
      let commentId = c.id;
      if (!commentId) {
        // Create a stable ID from user_id and created_at for old comments
        const stableId = `${c.user_id}_${createdAtIso || createdAt || index}`;
        commentId = stableId;
      }

      return {
        id: commentId,
        user_id: c.user_id,
        username: c.username,
        profile_pic: c.profile_pic || null,
        comment: c.comment || c.content || '',
        created_at: createdAtIso,
        can_delete: !!currentUserId && c.user_id === currentUserId,
      };
    });

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
    // Frontend sends { comment: "..." } in JSON, but support { content } as well for safety
    const rawComment = req.body.comment || req.body.content;
    const userId = req.user.id;
    const username = req.user.username;

    if (!rawComment || rawComment.trim() === '') {
      return res.json({ success: false, message: 'Comment content is required' });
    }

    const postRef = db.collection(POSTS_COLLECTION).doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.json({ success: false, message: 'Post not found' });
    }

    const trimmed = rawComment.trim();

    // Firestore doesn't allow FieldValue.serverTimestamp() inside arrays
    // Use a regular timestamp instead (ISO string format)
    // Generate a unique ID for the comment so we can delete it later
    const commentId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const comment = {
      id: commentId,
      user_id: userId,
      username: username,
      // Match the field name the frontend expects: "comment"
      comment: trimmed,
      created_at: new Date().toISOString(),
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
    // Support both query param and body for postId
    const postId = req.query.postId || req.body.postId;

    if (!postId) {
      return res.json({ success: false, message: 'Post ID is required' });
    }

    if (!commentId) {
      return res.json({ success: false, message: 'Comment ID is required' });
    }

    const postRef = db.collection(POSTS_COLLECTION).doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.json({ success: false, message: 'Post not found' });
    }

    const postData = postDoc.data();
    const comments = postData.comments || [];
    
    // Find the comment to delete by ID
    let commentIndex = -1;
    let commentToDelete = null;
    
    // First, try to find by exact ID match (for new comments with IDs)
    commentIndex = comments.findIndex(comment => {
      if (comment.id && comment.id === commentId) {
        return true;
      }
      return false;
    });
    
    // If not found by ID, try fallback for old comments
    // The frontend might send an ID like "user_id_createdAt" for old comments
    if (commentIndex === -1) {
      commentIndex = comments.findIndex(comment => {
        // For old comments without stored IDs, reconstruct the ID and match
        if (!comment.id && comment.user_id === userId) {
          const commentCreatedAt = comment.created_at;
          let createdAtStr = '';
          
          // Handle both ISO string and Firestore Timestamp
          if (typeof commentCreatedAt === 'string') {
            createdAtStr = commentCreatedAt;
          } else if (commentCreatedAt && typeof commentCreatedAt.toDate === 'function') {
            createdAtStr = commentCreatedAt.toDate().toISOString();
          } else if (commentCreatedAt) {
            createdAtStr = String(commentCreatedAt);
          }
          
          // Try matching the reconstructed ID
          const reconstructedId = `${comment.user_id}_${createdAtStr}`;
          return reconstructedId === commentId;
        }
        return false;
      });
    }

    if (commentIndex === -1) {
      console.error('Comment not found. CommentId:', commentId, 'UserId:', userId, 'PostId:', postId);
      console.error('Available comments:', comments.map((c, idx) => ({ 
        index: idx, 
        id: c.id, 
        user_id: c.user_id, 
        hasId: !!c.id,
        created_at: c.created_at
      })));
      return res.json({ success: false, message: 'Comment not found. Please refresh the page and try again.' });
    }

    // Verify the user owns this comment
    commentToDelete = comments[commentIndex];
    if (commentToDelete.user_id !== userId) {
      return res.json({ success: false, message: 'Unauthorized: You can only delete your own comments' });
    }

    // Remove the comment from the array
    const updatedComments = comments.filter((_, index) => index !== commentIndex);

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
  getUploadUrl,
  createPost,
  deletePost,
  likePost,
  getComments,
  addComment,
  deleteComment,
  viewPost,
};
