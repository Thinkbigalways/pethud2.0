const multer = require('multer');
const path = require('path');
const { getUserByUsername, getUserByEmail, updateUser } = require('../utils/firestoreHelpers');
const { db, bucket } = require('../firebase/config');

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for profile images
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

const uploadCoverPhotoMiddleware = upload.single('cover_pic');
const uploadProfilePicMiddleware = upload.single('profile_pic');

/**
 * Upload file to Firebase Storage and return public URL
 */
async function uploadToFirebaseStorage(file, folder = 'profiles') {
  return new Promise((resolve, reject) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const fileName = `${folder}/${uniqueSuffix}${ext}`;
    
    const fileUpload = bucket.file(fileName);
    
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      public: true,
    });

    stream.on('error', (error) => {
      console.error('Error uploading to Firebase Storage:', error);
      reject(error);
    });

    stream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
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
    const urlParts = url.split('/');
    const fileName = urlParts.slice(-2).join('/');
    await bucket.file(fileName).delete();
    return true;
  } catch (error) {
    console.error('Error deleting from Firebase Storage:', error);
    return false;
  }
}

/**
 * Show profile page for /@:username
 */
async function showProfile(req, res, next) {
  try {
    const viewer = res.locals.user || null;
    const { username } = req.params;

    let profileUser = null;
    if (username) {
      profileUser = await getUserByUsername(username);
    }

    // Fallback to logged-in user if lookup fails
    if (!profileUser && viewer) {
      profileUser = await getUserByEmail(viewer.email);
    }

    if (!profileUser) {
      return res.status(404).render('error', {
        message: 'User not found',
        error: {},
      });
    }

    // Fetch posts for this user
    let posts = [];
    try {
      const postsSnapshot = await db
        .collection('posts')
        .where('user_id', '==', profileUser.id)
        .orderBy('created_at', 'desc')
        .limit(50)
        .get();

      posts = postsSnapshot.docs.map(doc => {
        const postData = doc.data();
        return {
          id: doc.id,
          ...postData,
          created_at: postData.created_at?.toDate ? postData.created_at.toDate() : new Date(),
          likes: postData.likes || [],
          comments: postData.comments || [],
          is_liked: viewer && postData.likes && postData.likes.includes(viewer.id),
          // Add comment count (comments is an array)
          commentCount: Array.isArray(postData.comments) ? postData.comments.length : 0,
          // Ensure likes is an array for count
          likeCount: Array.isArray(postData.likes) ? postData.likes.length : 0,
        };
      });
    } catch (err) {
      console.error('Error fetching posts:', err);
      // If there's an error (e.g., no index), just use empty array
      posts = [];
    }

    // Fetch friends list
    const friends = [];
    const friendStatus = 'none';
    const requestFromProfileUser = false;

    return res.render('profile', {
      title: `${profileUser.username} - Profile`,
      user: viewer,
      profileUser,
      posts,
      friends,
      friendStatus,
      requestFromProfileUser,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Handle cover photo upload
 */
async function uploadCoverPhoto(req, res, next) {
  try {
    uploadCoverPhotoMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.redirect('back');
      }

      const userId = req.user.id;
      const currentUser = await getUserByEmail(req.user.email);

      if (!req.file) {
        return res.redirect('back');
      }

      // Delete old cover photo if exists
      if (currentUser.cover_pic) {
        await deleteFromFirebaseStorage(currentUser.cover_pic);
      }

      // Upload new cover photo
      const publicUrl = await uploadToFirebaseStorage(req.file, 'profiles/cover');
      await updateUser(userId, { cover_pic: publicUrl });

      return res.redirect('back');
    });
  } catch (err) {
    console.error('Error uploading cover photo:', err);
    return res.redirect('back');
  }
}

/**
 * Handle profile picture upload
 */
async function uploadProfilePic(req, res, next) {
  try {
    uploadProfilePicMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.redirect('back');
      }

      const userId = req.user.id;
      const currentUser = await getUserByEmail(req.user.email);

      if (!req.file) {
        return res.redirect('back');
      }

      // Delete old profile pic if exists
      if (currentUser.profile_pic) {
        await deleteFromFirebaseStorage(currentUser.profile_pic);
      }

      // Upload new profile pic
      const publicUrl = await uploadToFirebaseStorage(req.file, 'profiles/pics');
      await updateUser(userId, { profile_pic: publicUrl });

      return res.redirect('back');
    });
  } catch (err) {
    console.error('Error uploading profile pic:', err);
    return res.redirect('back');
  }
}

module.exports = {
  showProfile,
  uploadCoverPhoto,
  uploadProfilePic,
};
