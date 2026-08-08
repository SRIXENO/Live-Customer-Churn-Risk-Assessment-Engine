const router = require('express').Router();
const Customer = require('../models/Customer');
const Campaign = require('../models/Campaign');

router.get('/distribution', async (req, res, next) => {
  try {
    const high = await Customer.countDocuments({ tier: 'high', deleted: { $ne: true } });
    const medium = await Customer.countDocuments({ tier: 'medium', deleted: { $ne: true } });
    const low = await Customer.countDocuments({ tier: 'low', deleted: { $ne: true } });
    res.json({ success: true, data: { high, medium, low } });
  } catch (err) {
    next(err);
  }
});

router.get('/trend', async (req, res, next) => {
  try {
    const days = Number(req.query.days || 7);
    const trend = Array.from({ length: days }).map((_, i) => {
      const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      return { date, avgScore: 42 + (i % 5) * 6 };
    });
    res.json({ success: true, data: trend });
  } catch (err) {
    next(err);
  }
});

router.get('/top-risk', async (req, res, next) => {
  try {
    const list = await Customer.find({ deleted: { $ne: true } })
      .sort({ riskScore: -1 })
      .limit(10)
      .lean();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.get('/campaign-impact', async (req, res, next) => {
  try {
    const list = await Campaign.find({}).limit(12).lean();
    const impact = list.map((c, i) => ({
      date: c.sentAt.slice(0, 10),
      sent: i + 1,
      recoveries: Math.max(0, 8 - i)
    }));
    res.json({ success: true, data: impact });
  } catch (err) {
    next(err);
  }
});

router.get('/weekly', async (req, res, next) => {
  try {
    const weekly = Array.from({ length: 6 }).map((_, i) => ({
      week: `W${i + 1}`,
      newCustomers: 18 + i,
      churned: 5 + (i % 3)
    }));
    res.json({ success: true, data: weekly });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const totalCustomers = await Customer.countDocuments({ deleted: { $ne: true } });
    const highRisk = await Customer.countDocuments({ tier: 'high', deleted: { $ne: true } });
    const campaignsSent = await Campaign.countDocuments({});
    res.json({
      success: true,
      data: {
        totalCustomers,
        highRisk,
        campaignsSent,
        recoveredThisWeek: 7
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
