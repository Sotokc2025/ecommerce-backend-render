// @ts-check
import mongoose from "mongoose";
import Category from "../models/category.js";
import Product from "../models/product.js";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  const dbURI = process.env.MONGODB_URI;

  await mongoose.connect(dbURI, {});

  // Categorías de madera (derivadas de los productos del FE)
  const categoriesData = [
    { name: "Dark woods", description: "really dark woods" },
    { name: "madera de pino", description: "producto especial para barnizar" },
    { name: "caoba de pino", description: "madera semi ligera resistente a la humedad" },
    {
      name: "Aglomerado",
      description:
        "aglomerado de alta resistencia al impacto, al manchado y desgaste ideal para cambios de temperatura",
    },
    {
      name: "madera importada",
      description: "originaria de paises varios",
    },
    {
      name: "mdf enchapado",
      description:
        "baja resistencia a la abrasión en el corte con utilizacion de pino ponderosa en 100% en sustratos y resinas",
    },
    {
      name: "madera color rojizo",
      description: "madera color rojizo, ideal para decoración de interiores",
    },
    {
      name: "madera primavera",
      description: "madera con moderada resistencia a plagas y menos propensa a deformarse",
    },
  ];

  // Subcategorías (hijas de categorías existentes)
  const subCategoriesData = [
    {
      name: "Aglomerado melaminado",
      description: "aglomerado baja resistencia a la abrasión en el corte hecha de pino",
      parentName: "Aglomerado",
    },
    {
      name: "Sande",
      description: "Tipo de triplay originario de Ecuador, color amarillento y textura fina",
      parentName: "madera importada",
    },
  ];

  // Limpiar colecciones
  await Category.deleteMany({});
  await Product.deleteMany({});

  // Insertar categorías principales
  const categoryDocs = {};
  for (const cat of categoriesData) {
    const category = new Category(cat);
    await category.save();
    categoryDocs[cat.name] = category;
  }

  // Insertar subcategorías
  for (const sub of subCategoriesData) {
    const parent = categoryDocs[sub.parentName];
    const subCat = new Category({
      name: sub.name,
      description: sub.description,
      parentCategory: parent._id,
    });
    await subCat.save();
    categoryDocs[sub.name] = subCat;
  }

  // Productos de madera (basados exactamente en el products.json del FE)
  const productsData = [
    {
      name: "Tablero Dark woods",
      description: "Fabricado de madera negra, ideal para decoraciones de color negro.",
      price: 800,
      stock: 100,
      imagesUrl: ["/assets/products/dark_wood.png"],
      category: categoryDocs["Dark woods"]._id,
    },
    {
      name: "Tablón de madera de pino",
      description: "Compuesto de varias hojas de madera de pino adheridas con resinas",
      price: 800,
      stock: 100,
      imagesUrl: ["/assets/products/pine_wood.png"],
      category: categoryDocs["madera de pino"]._id,
    },
    {
      name: "Tablón caoba de pino",
      description:
        "Compuesto de varias hojas de caoba de pino adheridas con resinas y melanina prensada a altas temperaturas.",
      price: 1100,
      stock: 100,
      imagesUrl: ["/assets/products/mahogany.png"],
      category: categoryDocs["caoba de pino"]._id,
    },
    {
      name: "Tablón de aglomerado",
      description:
        "Compuesto de capas de madera tipo pino y resinas urea-formaldehído y melamina prensada a altas temperaturas",
      price: 700,
      stock: 100,
      imagesUrl: ["/assets/products/particle_board.png"],
      category: categoryDocs["Aglomerado"]._id,
    },
    {
      name: "Tablón de aglomerado melaminado",
      description:
        "Compuesto de capas de madera con material melamínico resinas urea-formaldehído prensado a altas temperaturas.",
      price: 1000,
      stock: 400,
      imagesUrl: ["/assets/products/melamine.png"],
      category: categoryDocs["Aglomerado melaminado"]._id,
    },
    {
      name: "Tablero de mdf enchapado",
      description:
        "Compuesto de capas de madera fina de alta calidad, adherido con resinas urea-formaldehído",
      price: 1800,
      stock: 400,
      imagesUrl: ["/assets/products/mdf.png"],
      category: categoryDocs["mdf enchapado"]._id,
    },
    {
      name: "Tablero de Sande",
      description:
        "Compuesto de capas de madera super fina con un veteado ligero con muy buena resistencia.",
      price: 1800,
      stock: 400,
      imagesUrl: ["/assets/products/sande.png"],
      category: categoryDocs["Sande"]._id,
    },
    {
      name: "Tablero de mdf en ingles",
      description:
        "Compuesto de fibra de madera y resinas sintéticas, con textura homogénea y delicada.",
      price: 1700,
      stock: 100,
      imagesUrl: ["/assets/products/mdf.png"],
      category: categoryDocs["madera importada"]._id,
    },
    {
      name: "Tablero de madera de cedro",
      description:
        "Compuesto de placas de cedro y resinas sintéticas, con textura sumamente fina y estética.",
      price: 1700,
      stock: 100,
      imagesUrl: ["/assets/products/cedar.png"],
      category: categoryDocs["madera color rojizo"]._id,
    },
    {
      name: "Tablero madera primavera",
      description: "fabricado de madera amarilla, textura de media a bastante gruesa y resina",
      price: 800,
      stock: 100,
      imagesUrl: ["/assets/products/primavera.png"],
      category: categoryDocs["madera primavera"]._id,
    },
  ];

  for (const prod of productsData) {
    const product = new Product(prod);
    await product.save();
  }

  console.log("✅ Seed de productos de madera insertado correctamente en maderas.db.");
  await mongoose.disconnect();
}

seed();
