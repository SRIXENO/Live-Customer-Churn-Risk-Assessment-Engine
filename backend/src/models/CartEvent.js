const mongoose = require('mongoose');
module.exports = mongoose.model('CartEvent', new mongoose.Schema({}, { strict: false }));
