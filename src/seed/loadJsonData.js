import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import User from "../models/user.js";
import Order from "../models/order.js";
import Address from "../models/shippingAddress.js";
import PaymentMethod from "../models/paymentMethod.js";

dotenv.config();

const DB_USERS_PATH = path.join(process.cwd(), "db-users");

async function loadFile(filename) {
  const filePath = path.join(DB_USERS_PATH, filename);
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

async function seedData() {
  try {
    const dbURI = process.env.MONGODB_URI;
    console.log("🚀 Conectando a MongoDB Atlas...");
    await mongoose.connect(dbURI);

    // 1. Usuarios (Karlita y otros)
    const usersData = await loadFile("maderas-db.users.json");
    console.log(`📦 Procesando ${usersData.length} usuarios...`);
    await User.deleteMany({});

    // Ajustar los datos de Mongo Export ($oid) a formato Mongoose
    const processedUsers = usersData.map(u => ({
      ...u,
      _id: u._id?.$oid || u._id,
      displayName: u.displayName || u.email.split("@")[0] || "Usuario TyMCO",
      avatar: u.avatar || "https://placehold.co/100x100.png"
    }));
    await User.insertMany(processedUsers);
    console.log("✅ Usuarios cargados.");

    // 2. Direcciones de Envío
    const addressesData = await loadFile("maderas-db.shippingaddresses.json");
    console.log(`📦 Procesando ${addressesData.length} direcciones...`);
    await Address.deleteMany({});
    const processedAddresses = addressesData.map(a => ({
      ...a,
      _id: a._id?.$oid || a._id,
      user: a.user?.$oid || a.user
    }));
    await Address.insertMany(processedAddresses);
    console.log("✅ Direcciones cargadas.");

    // 3. Métodos de Pago
    const paymentMethodsData = await loadFile("maderas-db.paymentmethods.json");
    console.log(`📦 Procesando ${paymentMethodsData.length} métodos de pago...`);
    await PaymentMethod.deleteMany({});
    const processedPayments = paymentMethodsData.map(p => ({
      ...p,
      _id: p._id?.$oid || p._id,
      user: p.user?.$oid || p.user
    }));
    await PaymentMethod.insertMany(processedPayments);
    console.log("✅ Métodos de pago cargados.");

    // 4. Órdenes
    const ordersData = await loadFile("maderas-db.orders.json");
    console.log(`📦 Procesando ${ordersData.length} órdenes...`);
    await Order.deleteMany({});

    // Crear mapas de búsqueda para resolver strings heredados
    const addressMap = {};
    processedAddresses.forEach(a => { addressMap[a.address] = a._id; });

    const paymentMap = {};
    processedPayments.forEach(p => { paymentMap[p.type] = p._id; });

    const processedOrders = ordersData.map(o => {
      // Resolver shippingAddress (si es string, buscar en mapa)
      let sAddr = o.shippingAddress?.$oid || o.shippingAddress;
      if (typeof sAddr === 'string' && addressMap[sAddr]) {
        sAddr = addressMap[sAddr];
      }

      // Resolver paymentMethod (si es string, buscar en mapa)
      let pMeth = o.paymentMethod?.$oid || o.paymentMethod;
      if (typeof pMeth === 'string' && paymentMap[pMeth]) {
        pMeth = paymentMap[pMeth];
      }

      return {
        ...o,
        _id: o._id?.$oid || o._id,
        user: o.user?.$oid || o.user,
        shippingAddress: sAddr,
        paymentMethod: pMeth,
        products: (o.products || []).map(p => ({
          ...p,
          _id: p._id?.$oid || p._id,
          productId: p.productId?.$oid || p.productId
        })),
        createdAt: o.createdAt?.$date || o.createdAt,
        updatedAt: o.updatedAt?.$date || o.updatedAt
      };
    }).filter(o => {
      // Validar que tengamos ObjectIds válidos para campos requeridos
      // Si algún ID sigue siendo un string que no parece ID (ej: "credit_card" no mapeado), lanzará error
      return typeof o.shippingAddress === 'string' && o.shippingAddress.length === 24
        && typeof o.paymentMethod === 'string' && o.paymentMethod.length === 24;
    });

    console.log(`✨ ${processedOrders.length} órdenes válidas para inserción.`);
    await Order.insertMany(processedOrders);
    console.log("✅ Órdenes cargadas.");

    console.log("\n🔥 POBLACIÓN TOTAL COMPLETADA 🔥");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la población de datos:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedData();
