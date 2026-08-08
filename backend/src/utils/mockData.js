const { subDays } = require('date-fns');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = items => items[rand(0, items.length - 1)];
const tierForScore = score => (score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low');

function createCustomer(id) {
  const score = rand(10, 95);
  const name = `Xeno Customer ${String(id).padStart(3, '0')}`;
  const lastPurchaseDays = tierForScore(score) === 'high' ? rand(61, 120) : tierForScore(score) === 'medium' ? rand(31, 60) : rand(1, 30);
  const abandonRate = tierForScore(score) === 'high' ? rand(65, 90) : tierForScore(score) === 'medium' ? rand(35, 60) : rand(5, 25);
  const orderDrop = tierForScore(score) === 'high' ? rand(50, 90) : tierForScore(score) === 'medium' ? rand(20, 50) : rand(0, 20);
  return {
    _id: String(id),
    name,
    email: `xeno.customer${String(id).padStart(3, '0')}@gmail.com`,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128&bold=true`,
    riskScore: score,
    tier: tierForScore(score),
    joinDate: subDays(new Date(), rand(30, 800)).toISOString(),
    lastPurchaseDate: subDays(new Date(), lastPurchaseDays).toISOString(),
    daysInactive: lastPurchaseDays,
    cartAbandonRate: abandonRate,
    orderFrequencyDrop: orderDrop,
    orderHistory: Array.from({ length: rand(3, 10) }).map((_, i) => ({
      date: subDays(new Date(), rand(1, 180)).toISOString(),
      amount: rand(499, 12999),
      status: choice(['completed', 'pending', 'refunded']),
      itemCount: rand(1, 7)
    })),
    cartHistory: Array.from({ length: rand(2, 8) }).map((_, i) => ({
      date: subDays(new Date(), rand(1, 90)).toISOString(),
      cartValue: rand(299, 8999),
      itemCount: rand(1, 9),
      timeInCart: `${rand(2, 25)}m`
    })),
    scoreHistory: Array.from({ length: 12 }).map((_, i) => ({
      date: subDays(new Date(), 90 - i * 7).toISOString(),
      score: Math.max(5, Math.min(98, score + rand(-10, 10)))
    })),
    campaignHistory: Array.from({ length: rand(0, 5) }).map((_, i) => ({
      templateType: ['discount', 'cart', 'loyalty'][rand(0, 2)],
      sentAt: subDays(new Date(), rand(1, 120)).toISOString(),
      status: ['sent', 'opened', 'recovered'][rand(0, 2)]
    })),
    overrides: []
  };
}

const customers = Array.from({ length: 150 }).map((_, i) => createCustomer(i + 1));
const campaigns = [];
const overrides = [];

module.exports = { customers, campaigns, overrides, tierForScore };
