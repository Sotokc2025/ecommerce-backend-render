// @ts-check
import mongoose from "mongoose";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import Product from "../src/models/product.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/maderas-db";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const products = await Product.find();
    console.log(`Found ${products.length} products.`);

    for (const product of products) {
      // Create a deterministic-looking random curve favoring fewer products with huge sales
      const rand = Math.random();
      let sales = Math.floor(Math.random() * 20) + 1;
      if (rand > 0.8) sales += 50; 
      if (rand > 0.95) sales += 150;
      
      product.soldCount = sales;
      await product.save();
    }

    console.log("Updated soldCount for all products successfully.");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
