const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthModel = require('../models/authModel');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await AuthModel.findByEmail(email);
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 10);
    const id = await AuthModel.create({ name, email, password: hashed, role });
    const user = await AuthModel.findById(id);
    const token = signToken(user);

    res.status(201).json({ success: true, message: 'Registered successfully.', token, user });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await AuthModel.findByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = signToken(user);
    const { password: _, ...safeUser } = user;

    res.json({ success: true, message: 'Login successful.', token, user: safeUser });
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await AuthModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe };
