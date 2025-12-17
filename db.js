// Simple Firestore DB export so other modules can `require('../db')`
const { db } = require('./firebase/config');

module.exports = db;


