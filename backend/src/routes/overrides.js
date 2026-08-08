const router = require('express').Router();
const Customer = require('../models/Customer');
const Override = require('../models/Override');
const { emit } = require('../services/socketEmitter');

router.post('/', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.body.customerId });
    const record = new Override({
      ...req.body,
      customerId: req.body.customerId,
      managerId: '2',
      createdAt: new Date().toISOString()
    });
    await record.save();

    if (customer) {
      customer.tier = req.body.newTier;
      if (!customer.overrides) customer.overrides = [];
      customer.overrides.unshift(record.toObject());
      await customer.save();
    }

    emit('override_applied', record);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const list = await Override.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.get('/:customerId', async (req, res, next) => {
  try {
    const list = await Override.find({ customerId: req.params.customerId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
