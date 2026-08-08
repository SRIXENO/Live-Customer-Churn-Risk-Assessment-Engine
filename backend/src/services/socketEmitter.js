const { getSocket } = require('../config/socket');
function emit(event, payload) {
  const io = getSocket();
  if (io) io.emit(event, payload);
}
module.exports = { emit };
