// @ts-check
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function debugOrders() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maderas-db';
    try {
        await mongoose.connect(uri);
        const orders = await mongoose.connection.db.collection('orders').find().sort({ _id: -1 }).toArray();
        console.log("Total orders found:", orders.length);
        if (orders.length > 0) {
            console.log("Last order details:");
            console.log(JSON.stringify(orders[0], null, 2));
        }
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

debugOrders();
