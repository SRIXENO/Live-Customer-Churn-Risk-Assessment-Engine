const Customer = require('../models/Customer');
const Campaign = require('../models/Campaign');
const { sendCartEmail, sendDiscountEmail } = require('../services/emailService');
const adminRouter = require('../routes/admin');

function startLiveActivitySimulator(io) {
  setInterval(async () => {
    try {
      const customers = await Customer.find({ deleted: { $ne: true } });
      if (customers.length === 0) return;

      const customer = customers[Math.floor(Math.random() * customers.length)];
      const previousTier = customer.tier;
      const prevScore = customer.riskScore;

      const types = ['cart_abandoned', 'checkout_viewed', 'order_completed', 'inactive_drift'];
      const activityType = types[Math.floor(Math.random() * types.length)];
      
      const checkoutTemplates = [
        (name) => `${name} viewed the checkout page (Chrome / Windows) - pending payment gateway response.`,
        (name) => `${name} entered checkout flow with cart items - shipping details filled.`,
        (name) => `${name} accessed checkout page via cart reminder email link.`,
        (name) => `${name} initiated checkout flow - payment selection screen displayed.`
      ];

      const cartTemplates = [
        (name, value) => `${name} abandoned a cart worth ₹${value.toLocaleString('en-IN')} containing smart electronics.`,
        (name, value) => `${name} added products (₹${value.toLocaleString('en-IN')}) to cart but closed session.`,
        (name, value) => `${name} exited browser with ₹${value.toLocaleString('en-IN')} pending checkout tray.`,
        (name, value) => `${name} abandoned checkout session - delivery fee friction detected (Value: ₹${value.toLocaleString('en-IN')}).`
      ];

      const orderTemplates = [
        (name, amount) => `${name} completed a purchase of ₹${amount.toLocaleString('en-IN')}! (Gateway: Card)`,
        (name, amount) => `${name} finalized a transaction of ₹${amount.toLocaleString('en-IN')} using UPI gateway.`,
        (name, amount) => `${name} ordered products worth ₹${amount.toLocaleString('en-IN')} (coupon applied)!`,
        (name, amount) => `${name} placed an order of ₹${amount.toLocaleString('en-IN')} - warehouse packaging scheduled.`
      ];

      const driftTemplates = [
        (name, days) => `${name} has drifted from active sessions - offline for ${days} days.`,
        (name, days) => `${name} has not logged in for ${days} days - drift score warning triggered.`,
        (name, days) => `${name} zero app touchpoints recorded - inactive for ${days} days.`,
        (name, days) => `${name} customer lifecycle warning: ${days} days since last purchase date.`
      ];

      let description = '';

      if (activityType === 'cart_abandoned') {
        customer.cartAbandonRate = Math.min(100, (customer.cartAbandonRate || 0) + 15);
        customer.daysInactive = Math.max(1, customer.daysInactive || 1);
        
        const cartValue = Math.floor(Math.random() * 8000) + 500;
        customer.cartHistory.unshift({
          date: new Date().toISOString(),
          cartValue,
          itemCount: Math.floor(Math.random() * 5) + 1,
          timeInCart: `${Math.floor(Math.random() * 20) + 2}m`
        });
        const tmpl = cartTemplates[Math.floor(Math.random() * cartTemplates.length)];
        description = tmpl(customer.name, cartValue);
      } else if (activityType === 'checkout_viewed') {
        customer.daysInactive = Math.max(1, customer.daysInactive || 1);
        const tmpl = checkoutTemplates[Math.floor(Math.random() * checkoutTemplates.length)];
        description = tmpl(customer.name);
      } else if (activityType === 'order_completed') {
        customer.daysInactive = 0;
        customer.cartAbandonRate = Math.max(0, (customer.cartAbandonRate || 0) - 20);
        customer.orderFrequencyDrop = Math.max(0, (customer.orderFrequencyDrop || 0) - 15);
        
        const amount = Math.floor(Math.random() * 12000) + 999;
        customer.orderHistory.unshift({
          date: new Date().toISOString(),
          amount,
          status: 'completed',
          itemCount: Math.floor(Math.random() * 4) + 1
        });
        const tmpl = orderTemplates[Math.floor(Math.random() * orderTemplates.length)];
        description = tmpl(customer.name, amount);
      } else {
        customer.daysInactive = (customer.daysInactive || 0) + 3;
        customer.orderFrequencyDrop = Math.min(100, (customer.orderFrequencyDrop || 0) + 5);
        const tmpl = driftTemplates[Math.floor(Math.random() * driftTemplates.length)];
        description = tmpl(customer.name, customer.daysInactive);
      }

      const inactiveScore = (Math.min(customer.daysInactive, 120) / 120) * 40;
      const abandonScore = (Math.min(customer.cartAbandonRate, 100) / 100) * 30;
      const dropScore = (Math.min(customer.orderFrequencyDrop, 100) / 100) * 30;

      const score = Math.round(inactiveScore + abandonScore + dropScore);
      customer.riskScore = Math.max(1, Math.min(99, score));
      customer.tier = customer.riskScore >= 70 ? 'high' : customer.riskScore >= 40 ? 'medium' : 'low';
      
      if (!customer.scoreHistory) customer.scoreHistory = [];
      customer.scoreHistory.push({
        date: new Date().toISOString(),
        score: customer.riskScore
      });

      await customer.save();

      io.emit('customer_activity', {
        customerId: customer._id,
        customerName: customer.name,
        activityType,
        description,
        riskScore: customer.riskScore,
        tier: customer.tier,
        previousTier,
        prevScore,
        timestamp: new Date().toISOString()
      });

      io.emit('score_updated', {
        customerId: customer._id,
        newScore: customer.riskScore,
        newTier: customer.tier,
        previousTier
      });

      const config = adminRouter.autopilotConfig || {};
      
      if (config.discountEnabled && customer.riskScore >= config.discountThreshold) {
        try { await sendDiscountEmail(customer.toObject(), { discount_percent: 20, simulateOnly: true }); } catch {}
        
        const campaign = new Campaign({
          customerId: customer._id,
          email: customer.email,
          customerName: customer.name,
          templateType: 'discount',
          sentAt: new Date().toISOString(),
          status: 'sent',
          triggeredBy: 'autopilot'
        });
        await campaign.save();
        
        customer.campaignHistory.unshift(campaign.toObject());
        await customer.save();
        
        io.emit('campaign_sent', campaign);
        io.emit('autopilot_action', {
          customerName: customer.name,
          ruleName: `Risk Score Trigger (Score: ${customer.riskScore})`,
          actionTaken: 'Auto-sent 20% discount email (Simulated)',
          timestamp: new Date().toISOString()
        });
      }

      if (config.cartEnabled && customer.cartAbandonRate >= config.cartThreshold) {
        try { await sendCartEmail(customer.toObject(), { discount_percent: 15, simulateOnly: true }); } catch {}

        const campaign = new Campaign({
          customerId: customer._id,
          email: customer.email,
          customerName: customer.name,
          templateType: 'cart',
          sentAt: new Date().toISOString(),
          status: 'sent',
          triggeredBy: 'autopilot'
        });
        await campaign.save();

        customer.campaignHistory.unshift(campaign.toObject());
        await customer.save();

        io.emit('campaign_sent', campaign);
        io.emit('autopilot_action', {
          customerName: customer.name,
          ruleName: `Cart Abandon Rate Trigger (${customer.cartAbandonRate}%)`,
          actionTaken: 'Auto-sent cart checkout recovery reminder (Simulated)',
          timestamp: new Date().toISOString()
        });
      }

    } catch (err) {
      console.error('Error running simulator tick:', err);
    }
  }, 20000);
}

module.exports = { startLiveActivitySimulator };
