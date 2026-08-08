let ioRef = null;
function initSocket(io) { ioRef = io; }
function getSocket() { return ioRef; }
module.exports = { initSocket, getSocket };
