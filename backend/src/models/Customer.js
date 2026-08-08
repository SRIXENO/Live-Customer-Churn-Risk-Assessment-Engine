const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: String,
  riskScore: Number,
  tier: String,
  joinDate: String,
  lastPurchaseDate: String,
  daysInactive: Number,
  cartAbandonRate: Number,
  orderFrequencyDrop: Number,
  orderHistory: [{
    date: String,
    amount: Number,
    status: String,
    itemCount: Number
  }],
  cartHistory: [{
    date: String,
    cartValue: Number,
    itemCount: Number,
    timeInCart: String
  }],
  scoreHistory: [{
    date: String,
    score: Number
  }],
  campaignHistory: [{
    templateType: String,
    sentAt: String,
    status: String
  }],
  overrides: [{
    customerId: String,
    newTier: String,
    reason: String,
    managerId: String,
    createdAt: String
  }],
  deleted: { type: Boolean, default: false }
}, { timestamps: true, _id: false });

module.exports = mongoose.model('Customer', CustomerSchema);

