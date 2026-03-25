import Stripe from "stripe";
import Order from "../models/Order.js";

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

/**
 * Creates a Stripe PaymentIntent to initiate a checkout flow
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required to create a payment intent." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: "Order is already paid." });
    }

    // Stripe expects amount in cents for MXN, USD (ej. 100.50 MXN -> 10050)
    const amountInCents = Math.round(order.totalPrice * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "mxn",
      metadata: {
        orderId: order._id.toString(),
        userId: order.user.toString()
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ message: "Failed to create payment intent.", error: error.message });
  }
};
