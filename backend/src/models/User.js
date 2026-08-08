const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({ email: String, password: String, role: String, name: String, active: Boolean }, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
