// @ts-check
import polarService from "../services/polarService.js";
import Order from "../models/order.js";
/**
 * Crea un Checkout de Polar (Entidad Registrada - MoR / Merchant of Record) para iniciar el flujo de pago.
 * Reemplaza a Stripe para simplificar el cumplimiento global y delegar la carga fiscal.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
*/

export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    const user = /** @type {any} */ (req).user; // Inyectado por middleware de autenticación

    if (!orderId) {
      res.status(400).json({ message: "Se requiere el ID de orden para el cobro." });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Orden no encontrada." });
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.status(400).json({ message: "La orden ya ha sido pagada." });
      return;
    }

    // 🏆 ESTRATEGIA DE ENTIDAD REGISTRADA (MoR - Merchant of Record): Redirección segura
    const checkoutUrl = await polarService.createCheckout(order, user.email);

    res.status(200).json({
      checkoutUrl,
      message: "Redirigiendo a pasarela de pago segura (Polar.sh)"
    });

  }
  catch (error) {
    const err = /** @type {any} */ (error);
    console.error("Error en pasarela Polar:", err);
    res.status(500).json({ message: "Falla al iniciar pasarela Polar.", error: err.message });
  }
};