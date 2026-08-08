const apiResponse = {
  success: (data, message = 'ok') => ({ success: true, message, data }),
  error: (message = 'error', data = null) => ({ success: false, message, data })
};
module.exports = { apiResponse };
