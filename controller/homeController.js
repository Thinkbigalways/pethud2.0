const { db } = require('../firebase/config');
const { getUserByEmail } = require('../utils/firestoreHelpers');

const POSTS_COLLECTION = 'posts';
const USERS_COLLECTION = 'users';

/**
 * Home controller - Shows the main feed page
 */
async function showHome(req, res, next) {
  try {
    const user = res.locals.user || req.user || null;

    if (!user) {
      return res.redirect('/auth/login');
    }

    // Fetch posts from Firestore (ordered by created_at descending)
    let posts = [];
    try {
      const postsSnapshot = await db
        .collection(POSTS_COLLECTION)
        .orderBy('created_at', 'desc')
        .limit(50)
        .get();

      posts = postsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to JavaScript dates
          created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(),
          // Add comment count (comments is an array)
          commentCount: Array.isArray(data.comments) ? data.comments.length : 0,
          // Ensure likes is an array for count
          likeCount: Array.isArray(data.likes) ? data.likes.length : 0,
        };
      });
    } catch (err) {
      console.error('Error fetching posts:', err);
      // If there's an error (e.g., no index), just use empty array
      posts = [];
    }

    // Fetch user suggestions (users not yet friends)
    let suggestions = [];
    try {
      const usersSnapshot = await db
        .collection(USERS_COLLECTION)
        .limit(10)
        .get();

      suggestions = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(u => u.id !== user.id) // Exclude current user
        .slice(0, 5); // Limit to 5 suggestions
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      suggestions = [];
    }

    return res.render('index', {
      title: 'Home - PetHub',
      user,
      posts,
      suggestions,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error('Error in showHome:', err);
    return next(err);
  }
}

module.exports = {
  showHome,
};
