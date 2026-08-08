const router = require('express').Router();
const Customer = require('../models/Customer');
const Campaign = require('../models/Campaign');
const { emit } = require('../services/socketEmitter');
const { sendCartEmail, sendDiscountEmail, sendLoyaltyEmail } = require('../services/emailService');

async function dispatchEmail(customer, templateType, extras = {}) {
  if (templateType === 'loyalty') return sendLoyaltyEmail(customer, extras);
  if (templateType === 'discount') return sendDiscountEmail(customer, extras);
  return sendCartEmail(customer, extras);
}

router.post('/send', async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.body.customerId });
    if (!customer) return res.status(404).json({ success: false, message: 'customer not found' });

    await dispatchEmail(customer.toObject(), req.body.templateType, req.body);

    const campaign = new Campaign({
      ...req.body,
      email: customer.email,
      customerName: customer.name,
      sentAt: new Date().toISOString(),
      status: 'sent'
    });
    await campaign.save();

    if (!customer.campaignHistory) customer.campaignHistory = [];
    customer.campaignHistory.unshift(campaign.toObject());
    await customer.save();

    emit('campaign_sent', campaign);
    res.json({ success: true, data: campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/bulk', async (req, res) => {
  try {
    const sent = [];
    for (const id of req.body.customerIds || []) {
      const customer = await Customer.findOne({ _id: id });
      if (!customer) continue;

      await dispatchEmail(customer.toObject(), req.body.templateType, req.body);

      const campaign = new Campaign({
        customerId: id,
        email: customer.email,
        customerName: customer.name,
        templateType: req.body.templateType,
        sentAt: new Date().toISOString(),
        status: 'sent'
      });
      await campaign.save();

      if (!customer.campaignHistory) customer.campaignHistory = [];
      customer.campaignHistory.unshift(campaign.toObject());
      await customer.save();

      sent.push(campaign);
    }
    res.json({ success: true, data: sent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res, next) => {
  try {
    const list = await Campaign.find({}).sort({ sentAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const list = await Campaign.find({}).lean();
    const byTemplate = list.reduce((a, c) => {
      a[c.templateType] = (a[c.templateType] || 0) + 1;
      return a;
    }, {});
    res.json({
      success: true,
      data: {
        totalSent: list.length,
        byTemplate,
        recoveryRate: 24
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:customerId', async (req, res, next) => {
  try {
    const list = await Campaign.find({ customerId: req.params.customerId }).sort({ sentAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
