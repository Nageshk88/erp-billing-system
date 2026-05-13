const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/crmController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/:customerId/profile', ctrl.getProfile);
router.put('/:customerId/profile', ctrl.updateProfile);
router.get('/:customerId/analytics', ctrl.analytics);
router.get('/:customerId/frequently-bought', ctrl.frequentlyBought);
router.get('/:customerId/dropped-items', ctrl.droppedItems);
router.get('/:customerId/latest-new-product', ctrl.latestNewProduct);

module.exports = router;
