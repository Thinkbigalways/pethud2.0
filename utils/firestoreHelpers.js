const { db, admin } = require('../firebase/config');

// Firestore FieldValue helper
const FieldValue = admin.firestore.FieldValue;

// Collection names
const USERS_COLLECTION = 'users';

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Get user by username
 */
async function getUserByUsername(username) {
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('username', '==', username)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Create user
 */
async function createUser(userData) {
  const docRef = await db.collection(USERS_COLLECTION).add({
    ...userData,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });
  return { id: docRef.id, ...userData };
}

/**
 * Update user
 */
async function updateUser(userId, updates) {
  await db.collection(USERS_COLLECTION).doc(String(userId)).update({
    ...updates,
    updated_at: FieldValue.serverTimestamp(),
  });
}

module.exports = {
  getUserByEmail,
  getUserByUsername,
  createUser,
  updateUser,
  USERS_COLLECTION,
};


