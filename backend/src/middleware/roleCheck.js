function roleCheck(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ success: false, message: 'forbidden' });
}
module.exports = { roleCheck };
