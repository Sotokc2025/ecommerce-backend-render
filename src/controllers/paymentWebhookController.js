// @ts-check
import Order from "../models/order.js";
import polarService from "../services/polarService.js";
import mmService from "../services/mmService.js";

/**
 * Payment Webhook Controller (Polar.sh / Entidad Registrada)
 * Automatización de Flujo Real (Fase 8)
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
*/
export const handlePolarWebhook = async (req, res) => {
  const payload = JSON.stringify(req.body); // Cuerpo raw (JSON)
  
  // Casting seguro para evitar tipos string | string[] del linter
  const signature = String(req.headers['webhook-signature'] || '');
  const timestamp = String(req.headers['webhook-timestamp'] || '');
  const msgId = String(req.headers['webhook-id'] || '');

  // 🛡️ Blindaje de Autenticidad: Verificación de Firma HMAC
  const isValid = polarService.verifyWebhook(payload, signature, timestamp, msgId);
  if (!isValid) {
    console.warn('⚠️ Webhook INVALIDO recibido bloqueado.');
    res.status(401).json({ error: 'Firma invalida' });
    return;
  }

  const event = req.body;
  const eventType = event.type; // e.g. 'order.paid' o 'checkout.updated'

  console.log(`📡 Recibido Webhook de Polar: ${eventType}`);

  try {
    // 🏆 Fase 8: Automatización de Éxito de Pago
    if (eventType === 'order.paid' || (eventType === 'checkout.updated' && event.data.status === 'succeeded')) {
      const orderData = event.data;
      const orderId = orderData.metadata?.orderId;

      if (!orderId) {
        console.warn('⚠️ No se encontró orderId en la metadata del webhook.');
        res.status(200).send('Ignorado'); 
        return;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        console.error(`❌ Orden ${orderId} no encontrada en MongoDB Atlas.`);
        res.status(404).send('Error');
        return;
      }

      if (order.paymentStatus === 'paid') {
        res.status(200).send('Ya procesada');
        return;
      }

      // ✅ 1. Actualización Atómica en MongoDB (Ecommerce)
      order.paymentStatus = 'paid';
      order.status = 'processing';
      await order.save();
      console.log(`✅ Orden ${orderId} marcada como PAGADA.`);

      // 🔥 2. Sincronización Inversa a MM (Maestro de Inventarios)
      try {
        await mmService.registerSale(order.products);
        console.log(`🔥 Sincronización de venta a MM completada para orden ${orderId}`);
      } catch (e) {
        console.error(`⚠️ Venta en MM fallida para orden ${orderId}. Se requiere intervención manual en ERP.`);
      }
    }

    res.status(200).send('Evento procesado.');
  } catch (err) {
    console.error('❌ Error de servidor en Webhook Handler:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
