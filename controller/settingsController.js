const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const { getUserByEmail, updateUser } = require('../utils/firestoreHelpers');
const { bucket } = require('../firebase/config');

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

const uploadProfileMiddleware = upload.fields([
  { name: 'profile_pic', maxCount: 1 },
  { name: 'cover_pic', maxCount: 1 }
]);

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

function requireViewer(req, res) {
  const viewer = res.locals.user;
  if (!viewer) {
    return null;
  }
  return viewer;
}

async function loadCurrentUser(viewer) {
  if (!viewer || !viewer.email) return null;
  return getUserByEmail(viewer.email);
}

async function showSettings(req, res, next) {
  try {
    const viewer = requireViewer(req, res);
    if (!viewer) return res.redirect('/auth/login');

    const currentUser = await loadCurrentUser(viewer);
    return res.render('settings', {
      title: 'Account Settings',
      user: viewer,
      currentUser,
      successAccount: null,
      successPassword: null,
    });
  } catch (err) {
    return next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const viewer = requireViewer(req, res);
    if (!viewer) return res.redirect('/auth/login');
    const currentUser = await loadCurrentUser(viewer);
    if (!currentUser) return res.redirect('/auth/login');

    const { first_name, last_name, email, dob, gender } = req.body;

    await updateUser(currentUser.id, {
      first_name,
      last_name,
      email,
      dob,
      gender,
    });

    const updatedUser = await loadCurrentUser({ email });

    return res.render('settings', {
      title: 'Account Settings',
      user: viewer,
      currentUser: updatedUser,
      successAccount: 'Account updated successfully.',
      successPassword: null,
    });
  } catch (err) {
    return next(err);
  }
}

async function updatePassword(req, res, next) {
  try {
    const viewer = requireViewer(req, res);
    if (!viewer) return res.redirect('/auth/login');
    const currentUser = await loadCurrentUser(viewer);
    if (!currentUser) return res.redirect('/auth/login');

    const { password } = req.body;
    if (!password) {
      return res.render('settings', {
        title: 'Account Settings',
        user: viewer,
        currentUser,
        successAccount: null,
        successPassword: 'Password is required',
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    await updateUser(currentUser.id, { password: hashed });

    return res.render('settings', {
      title: 'Account Settings',
      user: viewer,
      currentUser,
      successAccount: null,
      successPassword: 'Password updated successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

async function showSettingsProfile(req, res, next) {
  try {
    const viewer = requireViewer(req, res);
    if (!viewer) return res.redirect('/auth/login');

    const currentUser = await loadCurrentUser(viewer);
    return res.render('settings-profile', {
      title: 'Profile Settings',
      user: viewer,
      currentUser,
      success: null,
      error: null,
    });
  } catch (err) {
    return next(err);
  }
}

async function updateSettingsProfile(req, res, next) {
  try {
    uploadProfileMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.render('settings-profile', {
          title: 'Profile Settings',
          user: req.user,
          currentUser: await loadCurrentUser(req.user),
          success: null,
          error: 'Error uploading file. Please try again.',
        });
      }

      const viewer = requireViewer(req, res);
      if (!viewer) return res.redirect('/auth/login');
      const currentUser = await loadCurrentUser(viewer);
      if (!currentUser) return res.redirect('/auth/login');

      const { bio } = req.body;
      const updates = { bio };

      // Handle profile picture upload
      if (req.files && req.files.profile_pic && req.files.profile_pic[0]) {
        // Delete old profile pic if exists
        if (currentUser.profile_pic) {
          await deleteFromFirebaseStorage(currentUser.profile_pic);
        }
        const profilePicUrl = await uploadToFirebaseStorage(req.files.profile_pic[0], 'profiles/pics');
        updates.profile_pic = profilePicUrl;
      }

      // Handle cover photo upload
      if (req.files && req.files.cover_pic && req.files.cover_pic[0]) {
        // Delete old cover pic if exists
        if (currentUser.cover_pic) {
          await deleteFromFirebaseStorage(currentUser.cover_pic);
        }
        const coverPicUrl = await uploadToFirebaseStorage(req.files.cover_pic[0], 'profiles/cover');
        updates.cover_pic = coverPicUrl;
      }

      await updateUser(currentUser.id, updates);

      const refreshed = await loadCurrentUser(viewer);

      return res.render('settings-profile', {
        title: 'Profile Settings',
        user: viewer,
        currentUser: refreshed,
        success: 'Profile updated successfully.',
        error: null,
      });
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.render('settings-profile', {
      title: 'Profile Settings',
      user: req.user,
      currentUser: await loadCurrentUser(req.user),
      success: null,
      error: 'Failed to update profile. Please try again.',
    });
  }
}

module.exports = {
  showSettings,
  updateSettings,
  updatePassword,
  showSettingsProfile,
  updateSettingsProfile,
};
