var express = require('express');
var router = express.Router();
var marketplaceController = require('../controller/marketplaceController');
var authenticateToken = require("../middlewares/auth");

// GET marketplace main page
router.get('/', authenticateToken, marketplaceController.showMarketplace);

// GET add ads page
router.get('/add-ads', authenticateToken, marketplaceController.showAddAd);

// POST create ad
router.post('/add-ads', authenticateToken, marketplaceController.createAd);

// GET my ads page
router.get('/my-ads', authenticateToken, marketplaceController.showMyAds);

// GET view single ad
router.get('/view-ad/:adId', authenticateToken, marketplaceController.viewAd);

// GET edit ad page
router.get('/edit-ads/:adId', authenticateToken, marketplaceController.showEditAd);

// POST update ad
router.post('/edit-ads/:adId', authenticateToken, marketplaceController.updateAd);

// DELETE ad
router.delete('/delete/:adId', authenticateToken, marketplaceController.deleteAd);

// GET filter/search API endpoint
router.get('/filter', authenticateToken, marketplaceController.filterAds);

module.exports = router;

