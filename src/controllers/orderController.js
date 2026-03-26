// @ts-check
import Order from "../models/order.js";
import Product from "../models/product.js";

async function getOrders(req, res, next) {
  try {
    const orders = await Order.find()
      .populate("user")
      .populate("products.productId")
      .populate("shippingAddress")
      .populate("paymentMethod")
      .sort({ status: 1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const id = req.params.id;
    const order = await Order.findById(id)
      .populate("user")
      .populate("products.productId")
      .populate("shippingAddress")
      .populate("paymentMethod");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // BOLA Fix: Check if user is owner or admin
    if (order.user._id.toString() !== req.user?.userId && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: You do not have access to this order" });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
}

async function getOrdersByUser(req, res, next) {
  try {
    const userId = req.params.userId;

    // BOLA Fix: Check if user is requesting their own orders or is admin
    if (userId !== req.user?.userId && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: You can only view your own orders" });
    }

    const orders = await Order.find({ user: userId })
      .populate("user")
      .populate("products.productId")
      .populate("shippingAddress")
      .populate("paymentMethod")
      .sort({ status: 1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
}

async function createOrder(req, res, next) {
  let stockUpdates = [];
  let stockChecks = [];
  const { user, products = [], shippingAddress, paymentMethod, shippingCost = 0 } = req.body;
  const idempotencyKey = req.headers?.["idempotency-key"];

  try {
    // Idempotency check
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey })
        .populate("user")
        .populate("products.productId")
        .populate("shippingAddress")
        .populate("paymentMethod");
      if (existingOrder) {
        return res.status(200).json(existingOrder);
      }
    }

    // Ensure users can only create orders for themselves (unless admin)
    if (user && user !== req.user?.userId && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Cannot create order for another user" });
    }

    // Verificar stock de todos los productos ANTES de crear la orden
    stockChecks = await Promise.all(
      products.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
          return { productId: item.productId, error: "Product not found" };
        }
        if (product.stock < item.quantity) {
          return {
            productId: item.productId,
            productName: product.name,
            error: `Insufficient stock. Available: ${product.stock}, Requested: ${item.quantity}`,
            available: product.stock,
            requested: item.quantity,
          };
        }
        return { productId: item.productId, product, ok: true };
      })
    );

    // Verificar si hubo algún error de stock
    const errors = stockChecks.filter((check) => check.error);
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Cannot create order due to stock issues",
        errors: errors.map((e) => ({
          productId: e.productId,
          productName: e.productName,
          message: e.error,
          available: e.available,
          requested: e.requested,
        })),
      });
    }

    // Reducir stock de cada producto de forma atómica
    stockUpdates = await Promise.all(
      stockChecks.map(async (check, index) => {
        const item = products[index];
        return Product.findByIdAndUpdate(
          check.productId,
          { $inc: { stock: -item.quantity, soldCount: item.quantity } },
          { new: true }
        );
      })
    );

    // Verificar que todas las actualizaciones fueron exitosas
    if (stockUpdates.some((update) => !update)) {
      // Si alguna actualización falló, revertir cambios
      await Promise.all(
        stockChecks.map(async (check, index) => {
          if (stockUpdates[index]) {
            const item = products.find(
              (p) => p.productId.toString() === check.productId.toString()
            );
            return Product.findByIdAndUpdate(check.productId, {
              $inc: { stock: item.quantity, soldCount: -item.quantity },
            });
          }
        })
      );
      return res.status(500).json({
        message: "Failed to update product stock. Order was not created.",
      });
    }

    const normalizedProducts = stockChecks.map((check, index) => ({
      productId: check.product._id,
      quantity: products[index].quantity,
      price: check.product.price,
    }));

    // Calcular precio total con precios del servidor
    const subtotal = normalizedProducts.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const totalPrice = subtotal + shippingCost;

    const newOrder = await Order.create({
      user,
      products: normalizedProducts,
      shippingAddress,
      paymentMethod,
      shippingCost,
      totalPrice,
      status: "pending",
      paymentStatus: "pending",
      idempotencyKey,
    });

    await newOrder.populate("user");
    await newOrder.populate("products.productId");
    await newOrder.populate("shippingAddress");
    await newOrder.populate("paymentMethod");

    res.status(201).json(newOrder);
  } catch (error) {
    // Si ya descontamos stock, debemos revertirlo en el catch si algo falló (como Order.create o populate)
    if (stockUpdates && stockUpdates.length > 0 && typeof stockChecks !== 'undefined') {
      console.log('Rolling back stock due to failure after updates...');
      await Promise.all(
        stockChecks.map(async (check, index) => {
          if (stockUpdates[index]) {
            return Product.findByIdAndUpdate(check.productId, {
              $inc: { stock: products[index].quantity, soldCount: -products[index].quantity },
            });
          }
        })
      ).catch(err => console.error("Error during stock rollback:", err));
    }
    next(error);
  }
}

async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Solo permitir actualizar ciertos campos
    const allowedFields = ["status", "paymentStatus", "shippingCost"];
    const filteredUpdate = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field];
      }
    }

    // Validar que al menos un campo sea proporcionado
    if (Object.keys(filteredUpdate).length === 0) {
      return res.status(400).json({
        message: "At least one field must be provided for update",
      });
    }

    // Si se actualiza shippingCost, recalcular totalPrice
    if (filteredUpdate.shippingCost !== undefined) {
      const order = await Order.findById(id);
      if (order) {
        const subtotal = order.products.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
        filteredUpdate.totalPrice = subtotal + filteredUpdate.shippingCost;
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, filteredUpdate, {
      new: true,
    })
      .populate("user")
      .populate("products.productId")
      .populate("shippingAddress")
      .populate("paymentMethod");

    if (updatedOrder) {
      return res.status(200).json(updatedOrder);
    } else {
      return res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    next(error);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate("products.productId");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Solo permitir cancelar si el estado lo permite
    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        message: "Cannot cancel order with status: " + order.status,
      });
    }

    // Restaurar el stock de los productos
    const stockRestorations = await Promise.all(
      order.products.map(async (item) => {
        return Product.findByIdAndUpdate(
          item.productId._id,
          { $inc: { stock: item.quantity, soldCount: -item.quantity } },
          { new: true }
        );
      })
    );

    // Verificar que todas las restauraciones fueron exitosas
    if (stockRestorations.some((update) => !update)) {
      return res.status(500).json({
        message: "Failed to restore product stock. Order status not changed.",
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
        paymentStatus: order.paymentStatus === "paid" ? "refunded" : "failed",
      },
      { new: true }
    )
      .populate("user")
      .populate("products.productId")
      .populate("shippingAddress")
      .populate("paymentMethod");

    res.status(200).json({
      message: "Order cancelled successfully. Stock has been restored.",
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true })
      .populate("user")
      .populate("products.productId")
      .populate("shippingAddress")
      .populate("paymentMethod");

    if (updatedOrder) {
      return res.status(200).json(updatedOrder);
    } else {
      return res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    next(error);
  }
}

async function updatePaymentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(id, { paymentStatus }, { new: true })
      .populate("user")
      .populate("products.productId")
      .populate("shippingAddress")
      .populate("paymentMethod");

    if (updatedOrder) {
      return res.status(200).json(updatedOrder);
    } else {
      return res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    next(error);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Solo permitir eliminar órdenes canceladas
    if (order.status !== "cancelled") {
      return res.status(400).json({
        message: "Only cancelled orders can be deleted",
      });
    }

    await Order.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export {
  cancelOrder,
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  getOrdersByUser,
  updateOrder,
  updateOrderStatus,
  updatePaymentStatus
};

