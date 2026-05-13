const jwt = require('jsonwebtoken');
const { User } = require('../models');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await user.validatePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: signToken(user), user: user.toSafeObject() });
  } catch (e) { next(e); }
};

exports.me = (req, res) => res.json(req.user.toSafeObject());

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!await user.validatePassword(currentPassword)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (e) { next(e); }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').lean({ virtuals: true });
    res.json(users.map(u => ({ ...u, id: u._id?.toString() })));
  } catch (e) { next(e); }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user.toSafeObject());
  } catch (e) { next(e); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...data } = req.body;
    Object.assign(user, data);
    if (password) user.password = password;
    await user.save();
    res.json(user.toSafeObject());
  } catch (e) { next(e); }
};
