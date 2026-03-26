// @ts-check
import mongoose from 'mongoose';
import Order from '../src/models/order.js';
import Product from '../src/models/product.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Reversión de Stock (Seguridad Operativa - Hito 8)
 * Libera el stock de órdenes pendientes que expiraron (24h)
 */
async function revertExpiredOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('🧹 Iniciando limpieza de órdenes expiradas...');

    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() - 24);

    const expiredOrders = await Order.find({
      paymentStatus: 'pending',
      status: 'pending',
      createdAt: { $lt: expirationDate }
    });

    console.log(`📦 Encontradas ${expiredOrders.length} órdenes para revertir.`);

    for (const order of expiredOrders) {
      console.log(`🔄 Revirtiendo stock para orden ${order._id}...`);
      
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity }
        });
      }

      order.status = 'cancelled';
      order.paymentStatus = 'failed';
      await order.save();
    }

    console.log('✅ Proceso de reversión completado.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en reversión de stock:', err);
    process.exit(1);
  }
}

revertExpiredOrders();