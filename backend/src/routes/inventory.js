const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/stock', ctrl.stockSummary);
router.get('/stock/:itemId', ctrl.itemStock);
router.get('/movements', ctrl.movements);
router.post('/adjustment', ctrl.adjustment);
router.get('/low-stock', ctrl.lowStock);

module.exports = router;
