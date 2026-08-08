const jwt = require('jsonwebtoken');
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'unauthorized' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); } catch { return res.status(401).json({ success: false, message: 'invalid token' }); }
}
module.exports = { auth };
