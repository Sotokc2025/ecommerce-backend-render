// @ts-check
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET || 'secret_test_123';
const API_URL = 'http://localhost:3000/api/payments/webhook';

/**
 * Simula el envío de un webhook de Polar.sh firmado
 * @param {string} orderId - ID de la orden en MongoDB Atlas
 */
async function simulatePolarWebhook(orderId) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const webhookId = 'wh_evt_' + Math.random().toString(36).substring(7);
  
  const payloadBody = {
    type: 'order.paid',
    data: {
      status: 'succeeded',
      metadata: {
        orderId: orderId
      }
    }
  };

  const payloadString = JSON.stringify(payloadBody);
  
  // 🛡️ Generación de firma HMAC (Sello Soberano)
  const signaturePayload = `${webhookId}.${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(signaturePayload)
    .digest('hex');

  console.log(`📡 Enviando webhook simulado para orden: ${orderId}...`);

  try {
    const response = await axios.post(API_URL, payloadBody, {
      headers: {
        'Content-Type': 'application/json',
        'webhook-id': webhookId,
        'webhook-timestamp': timestamp,
        'webhook-signature': signature
      }
    });

    console.log('✅ Respuesta del servidor:', response.status, response.data);
  } catch (error) {
    const e = /** @type {any} */ (error);
    console.error('❌ Error enviando webhook:', e.response?.data || e.message);
  }
}

// Para usar desde CLI: node scripts/simulate_polar_webhook.js <ORDER_ID>
const targetOrderId = process.argv[2];
if (targetOrderId) {
  simulatePolarWebhook(targetOrderId);
} else {
  console.log('⚠️ Uso: node scripts/simulate_polar_webhook.js <MONGO_ORDER_ID>');
}
