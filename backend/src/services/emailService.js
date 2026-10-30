const BREVO_EMAIL_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function safeLink(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? escapeHtml(url.href) : '';
  } catch {
    return '';
  }
}

function buildHtml({ title, customerName, body, ctaLabel, ctaUrl, details = [] }) {
  const rows = details
    .map(([label, value]) => `<tr><td style="padding:6px 0;color:#666">${escapeHtml(label)}</td><td style="padding:6px 0;text-align:right"><strong>${escapeHtml(value)}</strong></td></tr>`)
    .join('');
  return `
  <div style="font-family:system-ui,sans-serif;background:#f5f7fb;padding:24px">
    <div style="max-width:640px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="padding:24px;border-top:6px solid #4cb7ff">
        <h1 style="margin:0 0 8px;color:#0f172a">${title}</h1>
        <p style="margin:0;color:#334155">Hi ${escapeHtml(customerName || 'there')},</p>
      </div>
      <div style="padding:0 24px 24px;color:#334155;line-height:1.6">
        <p>${escapeHtml(body)}</p>
        ${rows ? `<table style="width:100%;margin:20px 0;border-collapse:collapse">${rows}</table>` : ''}
        ${safeLink(ctaUrl) ? `<a href="${safeLink(ctaUrl)}" style="display:inline-block;background:#4cb7ff;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">${escapeHtml(ctaLabel)}</a>` : ''}
      </div>
    </div>
  </div>`;
}

async function sendBrevoEmail({ to, subject, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Xeno Products';
  if (!apiKey || !senderEmail) {
    throw new Error('Brevo credentials are missing');
  }

  let response;
  try {
    response = await fetch(BREVO_EMAIL_ENDPOINT, {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent
      })
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('Brevo request timed out after 15 seconds');
    }
    throw new Error(`Could not reach Brevo: ${error.message}`);
  }

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Brevo send failed (${response.status}): ${responseText || response.statusText}`);
  }

  return responseText ? JSON.parse(responseText) : { messageId: null };
}

async function sendCartEmail(customer, extras = {}) {
  if (extras.simulateOnly) {
    console.log(`[MOCK EMAIL] Autopilot Cart Recovery bypassed Brevo dispatch for: ${customer.email}`);
    return { success: true, simulated: true };
  }
  const htmlContent = buildHtml({
    title: 'Your Cart Is Waiting',
    customerName: customer.name,
    body: 'You left items in your cart. Complete your checkout before the offer expires.',
    ctaLabel: 'Complete Checkout',
    ctaUrl: extras.checkout_link || process.env.CLIENT_URL,
    details: [
      ['Cart Value', extras.cart_value || 'Pending'],
      ['Discount', `${extras.discount_percent || '10'}%`],
      ['Order ID', extras.order_id || customer._id]
    ]
  });
  return sendBrevoEmail({
    to: customer.email,
    subject: `Your cart is waiting, ${customer.name}`,
    htmlContent
  });
}

async function sendDiscountEmail(customer, extras = {}) {
  if (extras.simulateOnly) {
    console.log(`[MOCK EMAIL] Autopilot Discount bypassed Brevo dispatch for: ${customer.email}`);
    return { success: true, simulated: true };
  }
  const htmlContent = buildHtml({
    title: 'Special Discount for You',
    customerName: customer.name,
    body: 'We have prepared a special discount to bring you back today.',
    ctaLabel: 'Use Discount',
    ctaUrl: extras.checkout_link || process.env.CLIENT_URL,
    details: [
      ['Discount', `${extras.discount_percent || '15'}%`],
      ['Risk Tier', customer.tier],
      ['Last Purchase', extras.last_purchase_date || customer.lastPurchaseDate || 'N/A']
    ]
  });
  return sendBrevoEmail({
    to: customer.email,
    subject: `A special offer for ${customer.name}`,
    htmlContent
  });
}

async function sendLoyaltyEmail(customer, extras = {}) {
  if (extras.simulateOnly) {
    console.log(`[MOCK EMAIL] Autopilot Loyalty bypassed Brevo dispatch for: ${customer.email}`);
    return { success: true, simulated: true };
  }
  const htmlContent = buildHtml({
    title: 'We Value Your Feedback',
    customerName: customer.name,
    body: 'Your feedback helps us improve. As a loyal customer, you also qualify for a special reward.',
    ctaLabel: 'Share Feedback',
    ctaUrl: extras.survey_link || process.env.CLIENT_URL,
    details: [
      ['Reward', extras.reward_text || 'Loyalty reward available'],
      ['Risk Tier', customer.tier],
      ['Last Purchase', extras.last_purchase_date || customer.lastPurchaseDate || 'N/A']
    ]
  });
  return sendBrevoEmail({
    to: customer.email,
    subject: `We’d love your feedback, ${customer.name}`,
    htmlContent
  });
}

module.exports = { sendCartEmail, sendDiscountEmail, sendLoyaltyEmail };
