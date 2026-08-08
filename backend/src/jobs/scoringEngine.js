const Customer = require('../models/Customer');
const { recalcCustomer } = require('../services/riskScorer');
const { emit } = require('../services/socketEmitter');

async function runScoring() {
  try {
    const list = await Customer.find({ deleted: { $ne: true } }).limit(25);
    const updated = [];
    for (const customer of list) {
      const previousTier = customer.tier;
      const next = recalcCustomer(customer);
      await next.save();
      emit('score_updated', { customerId: customer._id, newScore: next.riskScore, newTier: next.tier, previousTier });
      updated.push(next.toObject());
    }
    emit('bulk_scores_updated', { customers: updated, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error running scoring engine job:', err);
  }
}

module.exports = { runScoring };
