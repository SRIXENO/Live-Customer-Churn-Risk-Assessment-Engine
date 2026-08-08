const mongoose = require('mongoose');
module.exports = mongoose.model('Override', new mongoose.Schema({}, { strict: false }));
