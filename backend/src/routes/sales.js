const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/salesController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.put('/:id/confirm', ctrl.confirm);
router.put('/:id/cancel', ctrl.cancel);
router.post('/:id/convert', ctrl.convert);
router.get('/:id/pdf', ctrl.generatePdf);
router.get('/price-memory/:customerId/:itemId', ctrl.priceMemory);

module.exports = router;
