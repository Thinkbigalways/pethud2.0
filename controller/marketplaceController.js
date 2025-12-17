const multer = require('multer');
const path = require('path');
const { db, bucket, admin } = require('../firebase/config');

const FieldValue = admin.firestore.FieldValue;
const ADS_COLLECTION = 'marketplace_ads';

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

const uploadAdImages = upload.array('images', 10); // max 10 images

/**
 * Upload file to Firebase Storage and return public URL
 */
async function uploadToFirebaseStorage(file, folder = 'marketplace') {
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
 * Show marketplace main page
 */
async function showMarketplace(req, res, next) {
  try {
    const user = res.locals.user || req.user;
    if (!user) {
      return res.redirect('/auth/login');
    }

    return res.render('marketplace/index', {
      title: 'Marketplace',
      user,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Show add ad page
 */
async function showAddAd(req, res, next) {
  try {
    const user = res.locals.user || req.user;
    if (!user) {
      return res.redirect('/auth/login');
    }

    return res.render('marketplace/add-ads', {
      title: 'Post An Ad',
      user,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Create a new ad
 */
async function createAd(req, res, next) {
  try {
    uploadAdImages(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.render('marketplace/add-ads', {
          title: 'Post An Ad',
          user: req.user,
          error: 'Error uploading images. Please try again.',
        });
      }

      const user = req.user;
      const { title, description, price, location, category } = req.body;

      if (!title || !price) {
        return res.render('marketplace/add-ads', {
          title: 'Post An Ad',
          user,
          error: 'Title and price are required.',
        });
      }

      // Upload images to Firebase Storage
      const imageUrls = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const publicUrl = await uploadToFirebaseStorage(file, 'marketplace');
            imageUrls.push(publicUrl);
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        }
      }

      // Create ad in Firestore
      const adData = {
        user_id: user.id,
        username: user.username,
        title: title.trim(),
        description: description || '',
        price: parseFloat(price) || 0,
        location: location || '',
        category: category || 'other',
        images: imageUrls,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      };

      await db.collection(ADS_COLLECTION).add(adData);

      return res.redirect('/marketplace');
    });
  } catch (err) {
    console.error('Error creating ad:', err);
    return res.render('marketplace/add-ads', {
      title: 'Post An Ad',
      user: req.user,
      error: 'Failed to create ad. Please try again.',
    });
  }
}

/**
 * Show my ads page
 */
async function showMyAds(req, res, next) {
  try {
    const user = res.locals.user || req.user;
    if (!user) {
      return res.redirect('/auth/login');
    }

    // Fetch user's ads
    let ads = [];
    try {
      const adsSnapshot = await db
        .collection(ADS_COLLECTION)
        .where('user_id', '==', user.id)
        .orderBy('created_at', 'desc')
        .get();

      ads = adsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : new Date(),
      }));
    } catch (err) {
      console.error('Error fetching ads:', err);
      ads = [];
    }

    return res.render('marketplace/my-ads', {
      title: 'My Ads',
      user,
      ads,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * View single ad
 */
async function viewAd(req, res, next) {
  try {
    const user = res.locals.user || req.user;
    const { adId } = req.params;

    const adDoc = await db.collection(ADS_COLLECTION).doc(adId).get();
    if (!adDoc.exists) {
      return res.status(404).render('error', {
        message: 'Ad not found',
        error: {},
      });
    }

    const ad = {
      id: adDoc.id,
      ...adDoc.data(),
      created_at: adDoc.data().created_at?.toDate ? adDoc.data().created_at.toDate() : new Date(),
    };

    return res.render('marketplace/view-ad', {
      title: ad.title,
      user,
      ad,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Show edit ad page
 */
async function showEditAd(req, res, next) {
  try {
    const user = res.locals.user || req.user;
    const { adId } = req.params;

    if (!user) {
      return res.redirect('/auth/login');
    }

    const adDoc = await db.collection(ADS_COLLECTION).doc(adId).get();
    if (!adDoc.exists) {
      return res.status(404).render('error', {
        message: 'Ad not found',
        error: {},
      });
    }

    const adData = adDoc.data();
    if (adData.user_id !== user.id) {
      return res.status(403).render('error', {
        message: 'Unauthorized',
        error: {},
      });
    }

    const ad = {
      id: adDoc.id,
      ...adData,
      created_at: adData.created_at?.toDate ? adData.created_at.toDate() : new Date(),
    };

    return res.render('marketplace/edit-ads', {
      title: 'Edit Ad',
      user,
      ad,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Update ad
 */
async function updateAd(req, res, next) {
  try {
    uploadAdImages(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.redirect('back');
      }

      const user = req.user;
      const { adId } = req.params;
      const { title, description, price, location, category } = req.body;

      const adRef = db.collection(ADS_COLLECTION).doc(adId);
      const adDoc = await adRef.get();

      if (!adDoc.exists) {
        return res.status(404).render('error', {
          message: 'Ad not found',
          error: {},
        });
      }

      const adData = adDoc.data();
      if (adData.user_id !== user.id) {
        return res.status(403).render('error', {
          message: 'Unauthorized',
          error: {},
        });
      }

      const updates = {
        title: title.trim(),
        description: description || '',
        price: parseFloat(price) || 0,
        location: location || '',
        category: category || 'other',
        updated_at: FieldValue.serverTimestamp(),
      };

      // Upload new images if provided
      if (req.files && req.files.length > 0) {
        const imageUrls = [];
        for (const file of req.files) {
          try {
            const publicUrl = await uploadToFirebaseStorage(file, 'marketplace');
            imageUrls.push(publicUrl);
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        }
        if (imageUrls.length > 0) {
          updates.images = imageUrls;
        }
      }

      await adRef.update(updates);

      return res.redirect('/marketplace/my-ads');
    });
  } catch (err) {
    console.error('Error updating ad:', err);
    return res.redirect('back');
  }
}

/**
 * Delete ad
 */
async function deleteAd(req, res, next) {
  try {
    const user = req.user;
    const { adId } = req.params;

    const adDoc = await db.collection(ADS_COLLECTION).doc(adId).get();
    if (!adDoc.exists) {
      return res.json({ success: false, message: 'Ad not found' });
    }

    const adData = adDoc.data();
    if (adData.user_id !== user.id) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    // Delete images from Firebase Storage
    if (adData.images && adData.images.length > 0) {
      for (const imageUrl of adData.images) {
        await deleteFromFirebaseStorage(imageUrl);
      }
    }

    await db.collection(ADS_COLLECTION).doc(adId).delete();

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting ad:', err);
    return res.json({ success: false, message: 'Failed to delete ad' });
  }
}

/**
 * Filter/search ads API endpoint
 */
async function filterAds(req, res, next) {
  try {
    const { search, sort, page = 1, limit = 6 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 6;

    let query = db.collection(ADS_COLLECTION);

    // Apply search filter
    if (search && search.trim()) {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation - for production, consider Algolia or similar
      query = query.where('title', '>=', search.trim())
                   .where('title', '<=', search.trim() + '\uf8ff');
    }

    // Apply sorting
    if (sort === '1') {
      // Price: Low to High
      query = query.orderBy('price', 'asc');
    } else if (sort === '2') {
      // Price: High to Low
      query = query.orderBy('price', 'desc');
    } else {
      // Newest (default)
      query = query.orderBy('created_at', 'desc');
    }

    // Get total count (for pagination) - Note: This is expensive, consider caching
    const totalSnapshot = await query.get();
    const totalAds = totalSnapshot.size;
    const totalPages = Math.ceil(totalAds / limitNum);

    // Apply pagination - Firestore doesn't support offset, so we'll use limit
    // For better performance, consider using pagination tokens in production
    const adsSnapshot = await query.limit(limitNum).get();

    const ads = adsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : new Date(),
    }));

    return res.json({
      success: true,
      ads,
      totalPages,
      currentPage: pageNum,
      totalAds,
    });
  } catch (err) {
    console.error('Error filtering ads:', err);
    // If query fails (e.g., no index), return empty results
    return res.json({
      success: true,
      ads: [],
      totalPages: 1,
      currentPage: 1,
      totalAds: 0,
    });
  }
}

module.exports = {
  showMarketplace,
  showAddAd,
  createAd,
  showMyAds,
  viewAd,
  showEditAd,
  updateAd,
  deleteAd,
  filterAds,
};

