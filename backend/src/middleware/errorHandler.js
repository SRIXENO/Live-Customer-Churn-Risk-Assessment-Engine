const { apiResponse } = require('../utils/apiResponse');
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  res.status(status).json(apiResponse.error(err.message || 'server error'));
}
module.exports = { errorHandler };
