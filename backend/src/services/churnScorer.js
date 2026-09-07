const { tierForScore } = require('../utils/mockData');
function recalcCustomer(customer) {
  const drift = Math.round((Math.random() - 0.35) * 12);
  customer.riskScore = Math.max(1, Math.min(99, customer.riskScore + drift));
  customer.tier = tierForScore(customer.riskScore);
  return customer;
}
module.exports = { recalcCustomer };
