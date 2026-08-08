const { body } = require('express-validator');
const loginValidators = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
];
module.exports = { loginValidators };
