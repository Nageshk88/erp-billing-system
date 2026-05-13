const express = require('express');
const router = express.Router();
const { login, me, changePassword, listUsers, createUser, updateUser } = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', authenticate, me);
router.put('/change-password', authenticate, changePassword);
router.get('/users', authenticate, requireAdmin, listUsers);
router.post('/users', authenticate, requireAdmin, createUser);
router.put('/users/:id', authenticate, requireAdmin, updateUser);

module.exports = router;
