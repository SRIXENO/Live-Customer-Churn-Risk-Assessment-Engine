const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { apiResponse } = require('../utils/apiResponse');
const users = {
  'admin@xenoproducts.com': { id: '1', email: 'admin@xenoproducts.com', role: 'admin', name: 'Admin User', password: 'Admin@123' },
  'manager@xenoproducts.com': { id: '2', email: 'manager@xenoproducts.com', role: 'manager', name: 'Manager User', password: 'Manager@123' }
};
router.post('/login', (req, res) => {
  const emailKey = (req.body.email || '').trim().toLowerCase();
  const password = (req.body.password || '').trim();
  const user = users[emailKey];
  if (!user || user.password !== password) return res.status(401).json(apiResponse.error('invalid credentials'));
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.json(apiResponse.success({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } }));
});
router.post('/logout', (req, res) => res.json(apiResponse.success({})));
router.get('/me', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json(apiResponse.success({ id: payload.id, email: payload.email, role: payload.role, name: payload.name }));
  } catch {
    res.status(401).json(apiResponse.error('invalid token'));
  }
});
router.put('/change-password', (req, res) => res.json(apiResponse.success({})));
module.exports = router;
