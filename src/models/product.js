// @ts-check
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 1,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  imagesUrl: [
    {
      type: String,
      default: "https://placehold.co/800x600.png",
      trim: true,
    },
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  brand: {
    type: String,
    enum: ["Sayer-Lack", "TyMCO", "Standard"],
    default: "Standard",
  },
  source: {
    type: String,
    enum: ["Sayer-Lack", "TyMCO"],
    required: true,
  },
});

const Product = mongoose.model("Product", productSchema);

export default Product;