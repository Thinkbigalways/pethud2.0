var express = require('express');
var router = express.Router();
var authenticateToken = require("../middlewares/auth");
var optionalAuthenticateToken = require("../middlewares/optionalAuth"); // Added this line

var homeController = require('../controller/homeController');
var profileController = require("../controller/profileController");
var settingsController = require('../controller/settingsController');
var searchController = require('../controller/searchController');
var notificationsController = require('../controller/notificationsController');

/* GET home page. */
// Use optionalAuthenticateToken so unauthenticated users can still view the feed
router.get('/', optionalAuthenticateToken, homeController.showHome); // Modified this line to use optionalAuthenticateToken and simplified the path array

/* GET profile page */
router.get('/profile', authenticateToken, (req, res) => {
  if (!req.user || !req.user.username) {
    return res.redirect('/auth/login');
  }
  return res.redirect(`/@${req.user.username}`);
});
router.get('/@:username', authenticateToken, profileController.showProfile);
router.post('/profile/upload/cover', authenticateToken, profileController.uploadCoverPhoto);
router.post('/profile/upload/profile', authenticateToken, profileController.uploadProfilePic);

/* Settings page */
router.get('/settings', authenticateToken, settingsController.showSettings);
router.post('/settings', authenticateToken, settingsController.updateSettings);
router.post('/settings/password', authenticateToken, settingsController.updatePassword);
router.get('/settings/profile', authenticateToken, settingsController.showSettingsProfile)
router.post('/settings/profile', authenticateToken, settingsController.updateSettingsProfile)

/* Search */
router.get('/search', authenticateToken, searchController.showSearchPage);

/* About Us Page */
router.get(['/about-us'], (req, res) => {
  res.render('pages/about-us', { title: 'About Us' });
});

/* Terms & Conditions Page */
router.get('/terms-conditions', function (req, res, next) {
  res.render('pages/terms', { title: 'Terms & Conditions' });
});

router.get('/privacy-policy', function (req, res, next) {
  res.render('pages/privacy', { title: 'Privacy Policy' });
});

/* GET raffles page. */
router.get('/raffles', optionalAuthenticateToken, function (req, res, next) {
  res.render('pages/raffles', {
    title: 'Raffles and Giveaways',
    user: req.user
  });
});

module.exports = router;
