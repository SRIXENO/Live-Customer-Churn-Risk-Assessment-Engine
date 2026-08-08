import api from './api';

export async function sendCartEmail(customer, extras = {}) {
  return api.post('/campaigns/send', { customerId: customer._id, templateType: 'cart', ...extras });
}

export async function sendDiscountEmail(customer, extras = {}) {
  return api.post('/campaigns/send', { customerId: customer._id, templateType: 'discount', ...extras });
}

export async function sendLoyaltyEmail(customer, extras = {}) {
  return api.post('/campaigns/send', { customerId: customer._id, templateType: 'loyalty', ...extras });
}

export function getEmailTemplateId(kind) {
  return kind;
}
