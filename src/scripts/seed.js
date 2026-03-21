/* backend/src/scripts/seed.js */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import fs from "node:fs/promises";
import path from "node:path";
import dbConnection from "../config/database.js";

// Import Models
import User from "../models/user.js";
import Category from "../models/category.js";
import Product from "../models/product.js";
import ShippingAddress from "../models/shippingAddress.js";
import PaymentMethod from "../models/paymentMethod.js";
import Order from "../models/order.js";

const DATA_PATH = path.join(process.cwd(), "..", "frontend", "src", "data", "products.json");

/**
 * Creates or updates a user (Idempotent)
 */
async function seedUser(userData) {
  const existing = await User.findOne({ email: userData.email });
  if (existing) {
    console.log(`ℹ️  User already exists: ${userData.email}`);
    return existing;
  }

  const saltRounds = 10;
  const hashPassword = await bcrypt.hash(userData.password, saltRounds);
  
  const user = new User({
    displayName: userData.displayName,
    email: userData.email,
    hashPassword,
    role: userData.role,
    avatar: userData.avatar || "https://placehold.co/100x100.png",
    isActive: true,
  });

  await user.save();
  console.log(`✅ User created: ${userData.email} (${userData.role})`);
  return user;
}

/**
 * Creates or updates a category (Idempotent)
 */
async function seedCategory(catData) {
  const normalizedName = catData.name.trim();
  let category = await Category.findOne({ name: normalizedName });
  
  if (category) {
    return category;
  }

  category = new Category({
    name: normalizedName,
    description: catData.description || `Categoría de ${normalizedName}`,
    imageURL: catData.imageURL || `https://placehold.co/800x600.png?text=${encodeURIComponent(normalizedName)}`
  });

  await category.save();
  console.log(`✅ Category created: ${normalizedName}`);
  return category;
}

/**
 * Main Seed Function
 */
async function runSeed() {
  try {
    console.log("🚀 Starting database seed using frontend/src/data/products.json...");
    await dbConnection();

    // Reset if allowed
    if (process.env.SEED_ALLOW_RESET === "true") {
      console.log("⚠️  SEED_ALLOW_RESET is true. Clearing core collections...");
      await Product.deleteMany({});
      await Category.deleteMany({});
      await ShippingAddress.deleteMany({});
      await PaymentMethod.deleteMany({});
      await Order.deleteMany({});
      console.log("🗑️  Collections cleared.");
    }

    // 1. Seed Admin
    const adminEmail = process.env.DEV_ADMIN_EMAIL || "admin@tymco.mx";
    const adminPassword = process.env.DEV_ADMIN_PASSWORD || "AdminTyMCO2026!";
    await seedUser({
      displayName: "Administrador TyMCO",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      avatar: "https://placehold.co/100x100.png?text=Admin"
    });

    // 2. Seed Customers
    const c1 = await seedUser({
      displayName: "Cliente Test 1",
      email: "customer1@example.com",
      password: "Customer123!",
      role: "customer",
      avatar: "https://placehold.co/100x100.png?text=C1"
    });

    const c2 = await seedUser({
      displayName: "Cliente Test 2",
      email: "customer2@example.com",
      password: "Customer123!",
      role: "customer",
      avatar: "https://placehold.co/100x100.png?text=C2"
    });

    // 3. Load Product Data from JSON
    console.log(`📖 Loading products from: ${DATA_PATH}`);
    const productsJson = JSON.parse(await fs.readFile(DATA_PATH, "utf-8"));
    
    // 4. Seed Categories and Products
    const categoryMap = {};
    const productDocs = [];

    for (const item of productsJson) {
      const catInfo = item.category;
      const catName = catInfo.name || "General";
      
      if (!categoryMap[catName]) {
        categoryMap[catName] = await seedCategory(catInfo);
      }

      let product = await Product.findOne({ name: item.name });
      if (!product) {
        product = new Product({
          name: item.name,
          description: item.description,
          price: item.price || 100,
          stock: item.stock || 50,
          imagesUrl: item.imagesUrl || ["https://placehold.co/800x600.png"],
          category: categoryMap[catName]._id
        });
        await product.save();
        console.log(`✅ Product created: ${item.name}`);
      }
      productDocs.push(product);
    }

    // 5. Seed Extra Entities for Customers (Addresses & Payments)
    const customers = [c1, c2];
    for (const user of customers) {
      // Shipping Address
      const existingAddr = await ShippingAddress.findOne({ user: user._id });
      let addr;
      if (!existingAddr) {
        addr = new ShippingAddress({
          user: user._id,
          name: user.displayName,
          address: "Calle Falsa 123",
          city: "Ciudad de México",
          state: "CDMX",
          postalCode: "06700",
          country: "México",
          phone: "5512345678",
          isDefault: true
        });
        await addr.save();
        console.log(`📍 Address created for: ${user.email}`);
      } else {
        addr = existingAddr;
      }

      // Payment Method
      const existingPay = await PaymentMethod.findOne({ user: user._id });
      let pay;
      if (!existingPay) {
        pay = new PaymentMethod({
          user: user._id,
          type: "credit_card",
          cardNumber: "4111222233334444",
          cardHolderName: user.displayName,
          expiryDate: "12/28",
          isDefault: true
        });
        await pay.save();
        console.log(`💳 Payment Method created for: ${user.email}`);
      } else {
        pay = existingPay;
      }

      // 6. Seed an Initial Order
      const existingOrder = await Order.findOne({ user: user._id });
      if (!existingOrder && productDocs.length > 0) {
        const randomProduct = productDocs[Math.floor(Math.random() * productDocs.length)];
        const order = new Order({
          user: user._id,
          products: [{
            productId: randomProduct._id,
            quantity: 1,
            price: randomProduct.price
          }],
          shippingAddress: addr._id,
          paymentMethod: pay._id,
          totalPrice: randomProduct.price,
          status: "delivered",
          paymentStatus: "paid"
        });
        await order.save();
        console.log(`📦 Order created for: ${user.email}`);
      }
    }

    console.log("\n✨ Seed completed successfully with Profiles and Orders!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  } finally {
    // Note: disconnect happens after process.exit in catch/success, 
    // but good practice to have it here if we were just returning.
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runSeed();
