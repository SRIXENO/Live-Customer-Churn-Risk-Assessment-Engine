const mongoose = require('mongoose');
module.exports = mongoose.model('Campaign', new mongoose.Schema({}, { strict: false }));
