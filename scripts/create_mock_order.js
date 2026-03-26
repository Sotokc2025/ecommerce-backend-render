import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderItems: Array,
    shippingAddress: Object,
    paymentMethod: String,
    totalPrice: Number,
    isPaid: Boolean,
    paidAt: Date,
    status: String
  }, { strict: false });
  
  const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
  
  const o = await Order.create({
    user: new mongoose.Types.ObjectId(),
    orderItems: [{
      name: 'MOCK PRODUCT',
      quantity: 1,
      price: 100,
      product: new mongoose.Types.ObjectId()
    }],
    shippingAddress: { address:'x', city:'y', postalCode:'z', country:'w' },
    paymentMethod: 'Polar',
    totalPrice: 100,
    isPaid: false,
    status: 'pending'
  });
  
  console.log('ORDER_CREATED:' + o._id);
  await mongoose.disconnect();
}
run().catch(console.error);
