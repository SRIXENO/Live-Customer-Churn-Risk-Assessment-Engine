// Reload environment configs
const router = require('express').Router();
const Customer = require('../models/Customer');
const { runScoring } = require('../jobs/scoringEngine');
const { emit } = require('../services/socketEmitter');

router.get('/', async (req, res, next) => {
  try {
    const { tier, search, page = 1, limit = 20, sort } = req.query;
    const query = { deleted: { $ne: true } };
    if (tier && tier !== 'all') query.tier = tier;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const sortObj = {};
    if (sort) {
      const [field, dir] = sort.split(':');
      sortObj[field] = dir === 'asc' ? 1 : -1;
    } else {
      sortObj.riskScore = -1;
    }

    const total = await Customer.countDocuments(query);
    const start = (Number(page) - 1) * Number(limit);
    const items = await Customer.find(query)
      .sort(sortObj)
      .skip(start)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: {
        items,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, deleted: { $ne: true } }).lean();
    if (!customer) return res.status(404).json({ success: false, message: 'not found' });

    const Campaign = require('../models/Campaign');
    const Override = require('../models/Override');

    const campaignHistory = await Campaign.find({ customerId: customer._id }).sort({ sentAt: -1 }).lean();
    const overrideHistory = await Override.find({ customerId: customer._id }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: {
        ...customer,
        campaignHistory,
        overrideHistory
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/orders', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, deleted: { $ne: true } }, 'orderHistory').lean();
    if (!customer) return res.status(404).json({ success: false, message: 'not found' });
    res.json({ success: true, data: customer.orderHistory || [] });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/carts', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, deleted: { $ne: true } }, 'cartHistory').lean();
    if (!customer) return res.status(404).json({ success: false, message: 'not found' });
    res.json({ success: true, data: customer.cartHistory || [] });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/score-history', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, deleted: { $ne: true } }, 'scoreHistory').lean();
    if (!customer) return res.status(404).json({ success: false, message: 'not found' });
    res.json({ success: true, data: customer.scoreHistory || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const newCustomer = new Customer({
      _id: String(Date.now()),
      ...req.body
    });
    await newCustomer.save();
    emit('customer_added', { customer: newCustomer });
    res.json({ success: true, data: newCustomer });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: 'not found' });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findOneAndDelete({ _id: customerId });
    if (!customer) return res.status(404).json({ success: false, message: 'not found' });

    const Campaign = require('../models/Campaign');
    const Override = require('../models/Override');

    await Campaign.deleteMany({ customerId });
    await Override.deleteMany({ customerId });

    emit('customer_deleted', { customerId, customer });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    const { ids } = req.body;
    const Campaign = require('../models/Campaign');
    const Override = require('../models/Override');

    if (Array.isArray(ids) && ids.length > 0) {
      const result = await Customer.deleteMany({ _id: { $in: ids } });
      await Campaign.deleteMany({ customerId: { $in: ids } });
      await Override.deleteMany({ customerId: { $in: ids } });

      emit('customers_deleted_bulk', { ids });
      return res.json({ success: true, data: { deleted: result.deletedCount, bulk: true } });
    }

    const result = await Customer.deleteMany({});
    await Campaign.deleteMany({});
    await Override.deleteMany({});

    emit('customers_cleared', { count: result.deletedCount });
    res.json({ success: true, data: { deleted: result.deletedCount, bulk: false } });
  } catch (err) {
    next(err);
  }
});

router.post('/recalculate', async (req, res, next) => {
  try {
    await runScoring();
    res.json({ success: true, data: { recalculated: true } });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/simulate', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, deleted: { $ne: true } });
    if (!customer) return res.status(404).json({ success: false, message: 'not found' });

    const daysInactive = req.body.daysInactive !== undefined ? Number(req.body.daysInactive) : customer.daysInactive;
    const cartAbandonRate = req.body.cartAbandonRate !== undefined ? Number(req.body.cartAbandonRate) : customer.cartAbandonRate;
    const orderFrequencyDrop = req.body.orderFrequencyDrop !== undefined ? Number(req.body.orderFrequencyDrop) : customer.orderFrequencyDrop;

    const inactiveScore = (Math.min(daysInactive, 120) / 120) * 40;
    const abandonScore = (Math.min(cartAbandonRate, 100) / 100) * 30;
    const dropScore = (Math.min(orderFrequencyDrop, 100) / 100) * 30;

    const score = Math.round(inactiveScore + abandonScore + dropScore);
    const riskScore = Math.max(1, Math.min(99, score));

    const previousTier = customer.tier;
    const newTier = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

    customer.daysInactive = daysInactive;
    customer.cartAbandonRate = cartAbandonRate;
    customer.orderFrequencyDrop = orderFrequencyDrop;
    customer.riskScore = riskScore;
    customer.tier = newTier;

    if (!customer.scoreHistory) customer.scoreHistory = [];
    customer.scoreHistory.push({
      date: new Date().toISOString(),
      score: riskScore
    });

    await customer.save();

    emit('score_updated', { customerId: customer._id, newScore: riskScore, newTier, previousTier, simulated: true });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/ai-analyze', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, deleted: { $ne: true } });
    if (!customer) return res.status(404).json({ success: false, message: 'not found' });

    const { daysInactive, cartAbandonRate, orderFrequencyDrop, riskScore, tier } = customer;

    // Check for real Gemini LLM API Key
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const prompt = `You are the Xeno Products Customer Retention AI Copilot.
Analyze this customer's telemetry data and generate a diagnostic risk assessment and recovery plan.

Customer Profile:
- Name: ${customer.name}
- Email: ${customer.email}
- Risk Score: ${riskScore}/100
- Risk Segment: ${tier}
- Days Inactive: ${daysInactive} days
- Cart Abandon Rate: ${cartAbandonRate}%
- Order Frequency Drop: ${orderFrequencyDrop}%

Recent Cart History:
${JSON.stringify(customer.cartHistory.slice(0, 3), null, 2)}

Recent Order History:
${JSON.stringify(customer.orderHistory.slice(0, 3), null, 2)}

Based on these telemetry factors, provide:
1. "diagnosis": A detailed diagnostic analysis explaining why this customer is at risk (or healthy) and which behavioral signals (inactivity, cart abandonment, drop-off) are driving this state.
2. "recommendation": A concrete recovery action plan (e.g. template type, discount recommendations, engagement style).
3. "discountCode": An appropriate custom promo code generated for this user.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'OBJECT',
                  properties: {
                    diagnosis: { type: 'STRING' },
                    recommendation: { type: 'STRING' },
                    discountCode: { type: 'STRING' }
                  },
                  required: ['diagnosis', 'recommendation', 'discountCode']
                }
              }
            })
          }
        );

        if (response.ok) {
          const resData = await response.json();
          const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const parsed = JSON.parse(responseText.trim());
            return res.json({
              success: true,
              data: {
                diagnosis: parsed.diagnosis,
                recommendation: parsed.recommendation,
                discountCode: parsed.discountCode,
                analyzedAt: new Date().toISOString(),
                isRealAi: true
              }
            });
          }
        }
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to rule engine:', geminiError);
      }
    }

    // Heuristics Rule Fallback Engine (Runs if no API key is supplied or API fails)
    let diagnosis = '';
    let recommendation = '';
    let discountCode = '';

    if (tier === 'high') {
      diagnosis = `CRITICAL WARNING: This customer is at extreme risk (Risk Score: ${riskScore}%). Primary drivers are severe inactivity of ${daysInactive} days and a high shopping cart abandonment rate of ${cartAbandonRate}%. In addition, their order purchase frequency has dropped by ${orderFrequencyDrop}%, showing a massive drop in product engagement.`;
      recommendation = `We recommend sending the high-urgency Discount Campaign Template with a 20% discount code. We should trigger a follow-up feedback email to find out if there was a bad checkout experience.`;
      discountCode = `SAVE20NOW`;
    } else if (tier === 'medium') {
      diagnosis = `ALERT: The customer shows moderate risk patterns (Risk Score: ${riskScore}%). The risk is mainly driven by ${daysInactive} days of inactivity and a ${cartAbandonRate}% cart abandonment rate. They are browsing products but dropping off before finalizing checkout.`;
      recommendation = `Send a gentle Cart Recovery Template reminder listing the products left in their cart and offering a 10% coupon. Recommend triggering this within the next 24 hours.`;
      discountCode = `RETURN10`;
    } else {
      diagnosis = `HEALTHY: The customer exhibits healthy metrics (Risk Score: ${riskScore}%). They have been inactive for only ${daysInactive} days, with minimal cart abandonment (${cartAbandonRate}%) and stable order frequency.`;
      recommendation = `Maintain relationship. Trigger a Loyalty Rewards template thanking them for their purchases, giving them early access to upcoming product collections without aggressive discounts.`;
      discountCode = `VIPMEMBER`;
    }

    res.json({
      success: true,
      data: {
        diagnosis,
        recommendation,
        discountCode,
        analyzedAt: new Date().toISOString(),
        isRealAi: false
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/negotiate-step', async (req, res, next) => {
  try {
    let customer;
    if (['sarah', 'david', 'elena'].includes(req.params.id)) {
      customer = {
        name: req.params.id === 'sarah' ? 'Sarah' : req.params.id === 'david' ? 'David' : 'Elena',
        email: `${req.params.id}.k@xenoproducts.com`,
        riskScore: req.params.id === 'sarah' ? 82 : req.params.id === 'david' ? 74 : 65,
        daysInactive: req.params.id === 'sarah' ? 15 : req.params.id === 'david' ? 10 : 30,
        cartAbandonRate: req.params.id === 'sarah' ? 40 : req.params.id === 'david' ? 50 : 25,
        orderFrequencyDrop: req.params.id === 'sarah' ? 12 : req.params.id === 'david' ? 15 : 8
      };
    } else {
      customer = await Customer.findOne({ _id: req.params.id, deleted: { $ne: true } });
      if (!customer) return res.status(404).json({ success: false, message: 'not found' });
    }

    const { history = [], mood = 'price_sensitive', strategy = 'empathetic', speaker = 'agent', humanMessage } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY;

    let reply = '';
    let sentiment = 50;
    let retentionProbability = 40;
    let isRealAi = false;

    // Assess current stats from history
    if (history.length > 0) {
      const lastItem = history[history.length - 1];
      sentiment = lastItem.sentiment ?? 50;
      retentionProbability = lastItem.retentionProbability ?? 40;
    }

    if (geminiKey) {
      try {
        let systemPrompt = '';
        if (speaker === 'agent') {
          if (humanMessage) {
            // Human takeover: assess new metrics based on human message
            reply = humanMessage;
            systemPrompt = `You are a metrics assessor for a Customer Retention Arena.
Review this customer's profile:
- Name: ${customer.name}
- Inactive: ${customer.daysInactive} days
- Cart Abandonment Rate: ${customer.cartAbandonRate}%
- Purchase frequency drop: ${customer.orderFrequencyDrop}%

The chat history with the Retention Agent (including a new manual message from the human manager: "${humanMessage}") is:
${JSON.stringify(history, null, 2)}

Assess the customer's current Sentiment Score (0 to 100, where 0 is furious/lost and 100 is delighted/saved) and the Probability of Retention (0 to 100) after this manager intervention. Output only the metrics.`;
          } else {
            // Agent turn: generate agent response and stats
            systemPrompt = `You are a Customer Retention Agent at Xeno Products.
You are negotiating to retain customer: ${customer.name}.
Customer Profile:
- Inactive: ${customer.daysInactive} days
- Cart Abandonment Rate: ${customer.cartAbandonRate}%
- Drop rate: ${customer.orderFrequencyDrop}%

Your negotiation strategy is: ${strategy}.
Here is the chat history:
${JSON.stringify(history, null, 2)}

Respond to the customer's latest reply. Be conversational and professional. If they complain, offer a resolution or a promo coupon (e.g., XENO20 for 20% off). Do not offer more than 25% discount.
Rate the customer's current sentiment (0 to 100) and the probability they will be retained (0 to 100) after this turn.`;
          }
        } else {
          // Customer turn: generate customer response and stats
          systemPrompt = `You are simulated customer: ${customer.name}.
Your current mood segment is: ${mood}.
Telemetry history:
- Inactive: ${customer.daysInactive} days
- Cart Abandonment Rate: ${customer.cartAbandonRate}%
- Order drop: ${customer.orderFrequencyDrop}%

Here is the chat history with the Retention Agent:
${JSON.stringify(history, null, 2)}

Respond to the agent's latest message as the customer. 
- If your mood is 'angry', complain about service issues (e.g. cart checkout failures or shipping delays).
- If your mood is 'price_sensitive', complain about high costs and mention competitors.
- If your mood is 'indifferent', sound detached and hard to engage.
- If the agent offers a solid deal (e.g. 20% off or free months), you can become more friendly and accept it. If you accept the deal, say you accept and thank them.
Rate your current sentiment (0 to 100) and the probability you will stay with Xeno (0 to 100) after this turn.`;
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'OBJECT',
                  properties: {
                    message: { type: 'STRING', description: 'The text response' },
                    sentiment: { type: 'INTEGER', description: 'Current customer sentiment score (0-100)' },
                    retentionProbability: { type: 'INTEGER', description: 'Estimated customer retention likelihood (0-100)' }
                  },
                  required: ['message', 'sentiment', 'retentionProbability']
                }
              }
            })
          }
        );
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
          reply = speaker === 'agent' && humanMessage ? humanMessage : parsed.message;
          sentiment = parsed.sentiment;
          retentionProbability = parsed.retentionProbability;
          isRealAi = true;
        }
      } catch (geminiError) {
        console.error('Negotiate Gemini failed, falling back to rule simulation:', geminiError);
      }
    }

    // Fallback simulation rule engine (Runs if API key is missing or calls fail)
    if (!isRealAi) {
      if (speaker === 'agent') {
        if (humanMessage) {
          reply = humanMessage;
          const containsDiscount = /discount|off|code|promo|20%|25%|15%/i.test(humanMessage);
          sentiment = Math.min(100, sentiment + (containsDiscount ? 25 : 10));
          retentionProbability = Math.min(100, retentionProbability + (containsDiscount ? 30 : 12));
        } else {
          if (strategy === 'empathetic') {
            reply = `Hello ${customer.name}, I see you've been inactive for ${customer.daysInactive} days. I want to apologize for any issues you've faced. To make things right, could I offer you a 20% discount on your next purchase?`;
            sentiment = Math.min(100, sentiment + 5);
          } else if (strategy === 'aggressive') {
            reply = `We noticed your purchase frequency dropped by ${customer.orderFrequencyDrop}%. We don't want to lose you, so here is a special offer: 25% off if you order in the next 24 hours.`;
            sentiment = Math.min(100, sentiment + 2);
          } else {
            reply = `I see you left items in your cart. We'd love to help you complete checkout. Here is a custom 15% discount code: Complete your order today.`;
            sentiment = Math.min(100, sentiment + 4);
          }
        }
      } else {
        // Customer turn
        const lastAgentMessage = history.findLast(h => h.sender === 'agent')?.text || '';
        const hasDiscountOffer = /20%|25%|discount|coupon/i.test(lastAgentMessage);

        if (hasDiscountOffer && sentiment > 40) {
          reply = `That sounds fair! I'll accept the 20% discount. Thank you for resolving this so quickly. I will complete my order now.`;
          sentiment = 85;
          retentionProbability = 95;
        } else {
          if (mood === 'angry') {
            reply = `I had checkout issues twice last week and support didn't reply! I'm really frustrated. A simple coupon isn't enough.`;
            sentiment = Math.max(5, sentiment - 15);
            retentionProbability = Math.max(5, retentionProbability - 10);
          } else if (mood === 'price_sensitive') {
            reply = `The competitor offers a cheaper plan. If you can give me at least a 20% discount, I might stay. Otherwise, I will close my account.`;
            sentiment = Math.max(10, sentiment - 8);
            retentionProbability = Math.max(10, retentionProbability - 12);
          } else {
            reply = `I don't know, I just haven't had time to use the platform. Not sure if I need it anymore.`;
            sentiment = Math.max(20, sentiment - 5);
            retentionProbability = Math.max(15, retentionProbability - 8);
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        message: reply,
        speaker,
        sentiment,
        retentionProbability,
        isRealAi
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/forecast-branch', async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, deleted: { $ne: true } });
    if (!customer) return res.status(404).json({ success: false, message: 'not found' });

    const { pastEvent, counterAction } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY;

    let forecastedScore = Math.max(10, customer.riskScore - 15);
    let forecastedTier = 'medium';
    let analysis = '';
    let isRealAi = false;

    if (geminiKey) {
      try {
        const prompt = `You are a Customer Retention Path Analyzer at Xeno Products.
Analyze this customer's current telemetry profiles:
- Name: ${customer.name}
- Current Risk Score: ${customer.riskScore}/100
- Days Inactive: ${customer.daysInactive} days
- Cart Abandon Rate: ${customer.cartAbandonRate}%
- Order Drop Rate: ${customer.orderFrequencyDrop}%

The customer experienced the following historical event: "${pastEvent}".
We are simulating the future outcome if our retention team had instead executed this counter-action: "${counterAction}".

Generate:
1. "forecastedScore": The new projected risk score (1-99) after applying the counter-action.
2. "forecastedTier": The risk tier resulting from the score ('low', 'medium', or 'high').
3. "analysis": A clear narrative explaining why this action would have saved (or failed to save) the account, detailing the behavioral variables changed.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'OBJECT',
                  properties: {
                    forecastedScore: { type: 'INTEGER', description: 'The new simulated risk score (1-99)' },
                    forecastedTier: { type: 'STRING', description: 'The resulting risk segment: low, medium, or high' },
                    analysis: { type: 'STRING', description: 'Technical analysis detailing the behavioral shifts' }
                  },
                  required: ['forecastedScore', 'forecastedTier', 'analysis']
                }
              }
            })
          }
        );
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
          forecastedScore = parsed.forecastedScore;
          forecastedTier = parsed.forecastedTier.toLowerCase();
          analysis = parsed.analysis;
          isRealAi = true;
        }
      } catch (geminiError) {
        console.error('Gemini forecast analysis failed, running fallback:', geminiError);
      }
    }

    if (!isRealAi) {
      // Rule-based heuristic simulation engine
      const hasDiscount = /discount|percent|off|coupon|promo/i.test(counterAction);
      const hasSupport = /support|call|apolog|resolution|contact|reach/i.test(counterAction);

      if (hasDiscount) {
        forecastedScore = Math.max(8, customer.riskScore - 35);
        analysis = `Applying the promotional discount offer immediately would have addressed the cost sensitivity signals. By mitigating price friction, the simulated cart abandonment rate is projected to decrease by 40%, dropping the overall risk profile of ${customer.name} to ${forecastedScore} (${forecastedScore < 40 ? 'Low Risk' : 'Medium Risk'}).`;
      } else if (hasSupport) {
        forecastedScore = Math.max(15, customer.riskScore - 20);
        analysis = `Triggering an immediate service outreach calls or empathetic check-in would resolve support blockages. Direct manager contact simulates an increase in customer trust, reducing inactivity drifts and leading to a forecasted score of ${forecastedScore} (${forecastedScore < 40 ? 'Low Risk' : 'Medium Risk'}).`;
      } else {
        forecastedScore = Math.max(20, customer.riskScore - 8);
        analysis = `The counter-action "${counterAction}" provides a mild engagement touchpoint. While it signals proactive oversight, it lacks specific resolution metrics to address primary cart abandonment or order decays. Risk decreases slightly to ${forecastedScore}.`;
      }
      forecastedTier = forecastedScore >= 70 ? 'high' : forecastedScore >= 40 ? 'medium' : 'low';
    }

    res.json({
      success: true,
      data: {
        forecastedScore,
        forecastedTier,
        analysis,
        isRealAi
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/audit-scripts', async (req, res, next) => {
  try {
    const { scenarioId, scriptA, scriptB } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY;

    let audit = '';
    let isRealAi = false;

    if (geminiKey) {
      try {
        const systemPrompt = `You are a Customer Success Optimization Auditor.
Analyze and compare these two negotiation scripts proposed for customer scenario context "${scenarioId}":
- Script A: "${scriptA}"
- Script B: "${scriptB}"

Write a detailed, structured comparison report in Markdown. Highlight:
1. **Pros/Cons of Script A**: (e.g. empathy level, cost efficiency).
2. **Pros/Cons of Script B**: (e.g. conversion rates, risk).
3. **Verdict**: Which script is better and why? Recommend specific optimizations.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }]
            })
          }
        );
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          audit = data.candidates[0].content.parts[0].text;
          isRealAi = true;
        }
      } catch (geminiError) {
        console.error('Audit Gemini failed:', geminiError);
      }
    }

    if (!isRealAi) {
      const hasDiscountA = /discount|off|code|promo|refund/i.test(scriptA);
      const hasDiscountB = /discount|off|code|promo|refund/i.test(scriptB);
      const hasApologyA = /sorry|apolog|experience|issue/i.test(scriptA);
      const hasApologyB = /sorry|apolog|experience|issue/i.test(scriptB);

      audit = `### A/B Script Optimization Audit Report (Heuristic Evaluation)

#### Script A Evaluation
*   **Empathy Level**: ${hasApologyA ? 'HIGH (Apology keywords detected)' : 'LOW (Lacks direct apology markers)'}
*   **Budget Friction**: ${hasDiscountA ? 'HIGH (Discounts detected)' : 'LOW (No budget marks)'}

#### Script B Evaluation
*   **Empathy Level**: ${hasApologyB ? 'HIGH (Apology keywords detected)' : 'LOW (Lacks direct apology markers)'}
*   **Budget Friction**: ${hasDiscountB ? 'HIGH (Discounts detected)' : 'LOW (No budget marks)'}

#### Strategic Recommendation
${
  hasApologyA && !hasDiscountA && hasDiscountB && !hasApologyB
    ? '**Script A is highly recommended** because it leads with empathy without immediately drawing from your budget. Trigger Script B only if further pricing objections occur.'
    : hasDiscountA && !hasDiscountB
    ? '**Script B is recommended for budget efficiency**, but needs empathy phrases added to boost engagement.'
    : 'Both scripts show standard alignment. We recommend leading with apologies and bug fixing before offering direct discount codes.'
}`;
    }

    res.json({
      success: true,
      data: {
        audit,
        isRealAi
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

