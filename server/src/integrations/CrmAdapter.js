'use strict';

/**
 * CrmAdapter — Stub for future CRM/policy-system integration.
 * 
 * Implement real connectors here when technical discovery with
 * the existing financial system is complete.
 */
class CrmAdapter {
  async pushApplication(application) {
    console.log('[CRM_STUB] pushApplication called — not yet implemented.');
    return { success: false, reason: 'CRM integration not yet configured' };
  }

  async getClientById(idNumber) {
    console.log('[CRM_STUB] getClientById called — not yet implemented.');
    return null;
  }

  async updateStatus(referenceNumber, status) {
    console.log('[CRM_STUB] updateStatus called — not yet implemented.');
    return { success: false };
  }
}

/**
 * WhatsAppAdapter — Stub for future WhatsApp lead ingestion.
 * 
 * Future flow:
 *   Marketing Campaign → WhatsApp → Lead → Application → CRM
 */
class WhatsAppAdapter {
  async createLeadFromWebhook(payload) {
    console.log('[WHATSAPP_STUB] createLeadFromWebhook called — not yet implemented.');
    return null;
  }

  async sendNotification(mobile, templateName, variables) {
    console.log('[WHATSAPP_STUB] sendNotification called — not yet implemented.');
    return null;
  }
}

module.exports = {
  crmAdapter: new CrmAdapter(),
  whatsAppAdapter: new WhatsAppAdapter(),
};
