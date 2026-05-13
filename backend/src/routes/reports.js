const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/dashboard', ctrl.dashboard);
router.get('/profit-loss', ctrl.profitLoss);
router.get('/balance-sheet', ctrl.balanceSheet);
router.get('/stock-summary', ctrl.stockSummary);
router.get('/tax-report', ctrl.taxReport);
router.get('/receivables', ctrl.receivables);
router.get('/payables', ctrl.payables);
router.get('/sales-analysis', ctrl.salesAnalysis);

module.exports = router;
