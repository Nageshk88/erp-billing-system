const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/accountingController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);
router.get('/accounts', ctrl.listAccounts);
router.post('/accounts', requireAdmin, ctrl.createAccount);
router.put('/accounts/:id', requireAdmin, ctrl.updateAccount);
router.get('/journal', ctrl.listJournal);
router.get('/journal/:id', ctrl.getJournal);
router.post('/journal', requireAdmin, ctrl.createJournal);

module.exports = router;
