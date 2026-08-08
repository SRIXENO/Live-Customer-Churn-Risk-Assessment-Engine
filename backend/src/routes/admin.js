const router = require('express').Router();
const Override = require('../models/Override');
const Customer = require('../models/Customer');
const Campaign = require('../models/Campaign');
const { customers } = require('../utils/mockData');

let autopilotConfig = {
  discountEnabled: false,
  discountThreshold: 75,
  cartEnabled: false,
  cartThreshold: 60
};

router.get('/users', (req, res) => res.json({ success: true, data: [
  { id: '1', email: 'admin@xenoproducts.com', role: 'admin', name: 'Admin User', active: true },
  { id: '2', email: 'manager@xenoproducts.com', role: 'manager', name: 'Manager User', active: true }
] }));

router.get('/config', (req, res) => res.json({ success: true, data: { highThreshold: 70, mediumThreshold: 40, lowThreshold: 0 } }));

router.get('/system-status', (req, res) => res.json({ success: true, data: { db: 'connected', socketCount: 1, lastRun: new Date().toISOString(), nextRun: new Date(Date.now()+1800000).toISOString() } }));

router.get('/override-logs', async (req, res, next) => {
  try {
    const list = await Override.find({}).sort({ createdAt: -1 }).lean();
    const Customer = require('../models/Customer');
    const enriched = await Promise.all(list.map(async log => {
      const c = await Customer.findById(log.customerId).lean();
      return {
        ...log,
        customerName: c ? c.name : 'Deleted Customer',
        customerEmail: c ? c.email : 'N/A'
      };
    }));
    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

router.get('/triggers', (req, res) => {
  res.json({ success: true, data: autopilotConfig });
});

router.post('/triggers', (req, res) => {
  Object.assign(autopilotConfig, req.body);
  res.json({ success: true, data: autopilotConfig });
});

router.post('/database/seed', async (req, res, next) => {
  try {
    const count = await Customer.countDocuments({ deleted: { $ne: true } });
    if (count > 0) {
      return res.status(400).json({ success: false, message: 'Database already has records. Please wipe it first.' });
    }
    await Customer.insertMany(customers);
    res.json({ success: true, message: `Seeded ${customers.length} mock customers successfully.` });
  } catch (err) {
    next(err);
  }
});

router.post('/database/clear', async (req, res, next) => {
  try {
    const resCustomers = await Customer.deleteMany({});
    const resCampaigns = await Campaign.deleteMany({});
    const resOverrides = await Override.deleteMany({});
    res.json({
      success: true,
      message: 'Database wiped clean successfully.',
      details: {
        customers: resCustomers.deletedCount,
        campaigns: resCampaigns.deletedCount,
        overrides: resOverrides.deletedCount
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.autopilotConfig = autopilotConfig;
