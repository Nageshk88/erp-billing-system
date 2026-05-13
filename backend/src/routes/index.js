const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/contacts', require('./contacts'));
router.use('/items', require('./items'));
router.use('/warehouses', require('./warehouses'));
router.use('/inventory', require('./inventory'));
router.use('/sales', require('./sales'));
router.use('/purchases', require('./purchases'));
router.use('/accounting', require('./accounting'));
router.use('/reports', require('./reports'));
router.use('/crm', require('./crm'));
router.use('/lsp', require('./lsp'));

module.exports = router;
