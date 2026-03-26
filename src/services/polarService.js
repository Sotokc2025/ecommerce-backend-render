// @ts-check
import axios from 'axios';
import crypto from 'crypto';
/*
 * Polar.sh Service (Entidad Registrada - MoR / Merchant of Record)
 * Estrategia de Blindaje Fiscal (v1.9.9): Reemplaza a Stripe para automatizar 
 * la recaudación y remisión de impuestos globales, delegando la responsabilidad
 * legal de la transacción a Polar.sh.
 * Sandbox: https://sandbox.polar.sh
*/
class PolarService {
  constructor() {
    // @ts-ignore
    this.apiKey = process.env.POLAR_API_KEY;
    // @ts-ignore
    this.organizationId = process.env.POLAR_ORGANIZATION_ID;
    // @ts-ignore
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.polar.sh/api/v1' 
      : 'https://sandbox.polar.sh/api/v1';
  }
  /**
   * Genera un Checkout Link de Polar para una orden específica.
   * @param {any} order 
   * @param {string} customerEmail
  */
 async createCheckout(order, customerEmail) {
    try {
      // 🧪 MOCK SIMULATOR (v1.9.9): Para pruebas rápidas sin llaves reales
      if (!this.apiKey || this.apiKey.includes('placeholder')) {
        console.warn('⚠️ [POLAR MOCK ACTIVE] Usando simulador de checkout para desarrollo.');
        // @ts-ignore
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return `${baseUrl}/order-confirmation?orderId=${order._id}&mock=true`;
      }
      // Polar usa un mapeo 1:1. Para propósitos de este Ecommerce,
      // creamos un pago único o vinculamos a productos pre-existentes en Polar.
      // Aquí usamos el endpoint de checkouts personalizados.
      const response = await axios.post(`${this.baseUrl}/checkouts`, {
        organization_id: this.organizationId,
        // @ts-ignore
        product_id: process.env.POLAR_DEFAULT_PRODUCT_ID, // Producto 'Carrito de Compras' en Polar
        customer_email: customerEmail,
        // @ts-ignore
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-confirmation?orderId=${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          external_id: order.user.toString() // Link directo al usuario de nuestro sistema
        }
      }, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      return response.data.url;
    } catch (error) {
      const axiosError = /** @type {any} */ (error);
      console.error('Polar Checkout Error:', axiosError.response?.data || axiosError.message);
      throw new Error('No se pudo iniciar la pasarela de pago Polar.');
    }
  }
  /**
   * Verifica la autenticidad del Webhook de Polar
   * @param {string} payload 
   * @param {string} signature 
  */
  
  /**
   * Verifica la autenticidad del Webhook de Polar siguiendo el estándar HMAC-SHA256.
   * @param {string} payload - El cuerpo raw de la petición.
   * @param {string} signature - El valor del header 'webhook-signature'.
   * @param {string} timestamp - El valor del header 'webhook-timestamp'.
   * @param {string} msgId - El valor del header 'webhook-id'.
   * @returns {boolean}
   */
  verifyWebhook(payload, signature, timestamp, msgId) {
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    if (!secret || secret.includes('placeholder')) {
      console.warn('⚠️ POLAR_WEBHOOK_SECRET no configurado. Bypass en modo SIMULADOR.');
      return true; // Solo para desarrollo/simulador
    }

    try {
      // Construcción del mensaje a firmar según el estándar Standard Webhooks
      const toSign = `${msgId}.${timestamp}.${payload}`;
      const hmac = crypto.createHmac('sha256', secret);
      const computed = hmac.update(toSign).digest('hex');

      // Comparación segura en tiempo constante para evitar ataques de tiempo
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
    } catch (e) {
      console.error('❌ Error verificando firma de webhook:', e);
      return false;
    }
  }
}

export default new PolarService();