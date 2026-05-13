const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/contactsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/ledger', ctrl.ledger);

module.exports = router;
