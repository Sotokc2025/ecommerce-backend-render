// @ts-check
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Category from "../models/category.js";
import Product from "../models/product.js";

/** @typedef {import('mongoose').Types.ObjectId} ObjectId */

/**
 * @typedef {Object} SayerProduct
 * @property {string} name
 * @property {string} price
 * @property {string} [category]
 * @property {string} [subcategory]
 * @property {string} [image_url]
 * @property {string} [local_image_path]
 */

/**
 * @typedef {Object} TymcoProduct
 * @property {string} name
 * @property {string} cat
 * @property {number} price
 * @property {string} [img]
 */

/**
 * @typedef {Object} SyncProduct
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {number} stock
 * @property {string[]} imagesUrl
 * @property {ObjectId} category
 * @property {number} soldCount
 * @property {"Sayer-Lack" | "TyMCO" | "Standard"} brand
 * @property {"Sayer-Lack" | "TyMCO"} source
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const SAYER_DATA_PATH = path.join(__dirname, "../../../scripts/data/products_sayer_lack.json");
const TYMCO_DATA_PATH = path.join(__dirname, "../../../scripts/data/products_tymco.json");

// --- CONFIGURACIÓN "CHINGÓN" DE CATEGORÍAS ---
const MAIN_CATEGORIES = [
  { name: "Pinturas y Barnices", img: "/assets/categories/cat_pinturas_premium.png", desc: "Todo para proteger y embellecer tus muebles." },
  { name: "Maderas y Tableros", img: "/assets/categories/cat_maderas_premium.png", desc: "Tableros, maderas finas y triplay de alta calidad." },
  { name: "Complementos", img: "/assets/categories/cat_complementos_premium.png", desc: "Adhesivos, accesorios y herramientas profesionales." }
];

/**
 * Mapeo de categorías crudas a nombres limpios y sus padres.
 * @type {Object<string, {name: string, parent: string}>}
 */
const CATEGORY_MAP_CLEAN = {
  "BARNICES PARA MADERA BASE AGUA": { name: "Barnices Base Agua", parent: "Pinturas y Barnices" },
  "LIMPIADORES": { name: "Limpiadores", parent: "Complementos" },
  "ADITIVOS": { name: "Aditivos", parent: "Complementos" },
  "PINTURAS": { name: "Pinturas", parent: "Pinturas y Barnices" },
  "LÍNEA CHALK PAINT": { name: "Chalk Paint", parent: "Pinturas y Barnices" },
  "IMPERMEABILIZANTES": { name: "Impermeabilizantes", parent: "Complementos" },
  "LÍNEA ESCOLAR": { name: "Línea Escolar", parent: "Pinturas y Barnices" },
  "ALTA DECORACIÓN": { name: "Alta Decoración", parent: "Pinturas y Barnices" },
  "PINTURA PARA VIDRIO": { name: "Pintura para Vidrio", parent: "Pinturas y Barnices" },
  "ADHESIVOS": { name: "Adhesivos", parent: "Complementos" },
  "DETALLADO AUTOMOTRIZ": { name: "Automotriz", parent: "Complementos" },
  "MANTENIMIENTOS INDUSTRIAL": { name: "Industrial", parent: "Pinturas y Barnices" },
  "ACCESORIOS": { name: "Accesorios", parent: "Complementos" },
  "RECUBRIMIENTOS": { name: "Recubrimientos", parent: "Pinturas y Barnices" },
  "TRIPLAY": { name: "Triplay", parent: "Maderas y Tableros" },
  "MADERAS": { name: "Maderas Finas", parent: "Maderas y Tableros" },
};

/**
 * Convierte strings a Title Case
 * @param {string} str 
 */
function toTitleCase(str) {
  return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
}

/**
 * Parses Sayer Lack price string
 * @param {string} priceStr 
 */
function parseSayerPrice(priceStr) {
  if (!priceStr) return 100;
  const match = priceStr.match(/\$ ([\d,.]+)/);
  if (match) return parseFloat(match[1].replace(/,/g, ""));
  return 100;
}

async function massiveSync() {
  try {
    console.log("🚀 Inyectando Categorías y Productos Premium...");
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI no definida");

    await mongoose.connect(uri);

    // 1. Cargar Datos
    /** @type {SayerProduct[]} */
    const sayerProducts = JSON.parse(fs.readFileSync(SAYER_DATA_PATH, "utf-8"));
    /** @type {TymcoProduct[]} */
    const tymcoProducts = JSON.parse(fs.readFileSync(TYMCO_DATA_PATH, "utf-8"));

    // 2. Crear Categorías Principales e Hijas
    /** @type {Map<string, ObjectId>} */
    const categoryIdMap = new Map();

    // Crear Padres
    for (const main of MAIN_CATEGORIES) {
      let doc = await Category.findOne({ name: main.name });
      if (!doc) {
        doc = await Category.create({ name: main.name, description: main.desc, imageURL: main.img });
        console.log(`⭐ Padre creado: ${main.name}`);
      }
      categoryIdMap.set(main.name, /** @type {ObjectId} */ (doc._id));
    }

    // Crear Hijas basadas en el mapeo
    const rawKeys = new Set([...sayerProducts.map(p => p.category), ...tymcoProducts.map(p => p.cat)]);
    for (const rawKey of rawKeys) {
      if (!rawKey) continue;
      const upperKey = rawKey.trim().toUpperCase();
      const mapping = CATEGORY_MAP_CLEAN[upperKey] || { name: toTitleCase(rawKey), parent: "Complementos" };

      const parentId = categoryIdMap.get(mapping.parent);
      let childDoc = await Category.findOne({ name: mapping.name });

      if (!childDoc) {
        childDoc = await Category.create({
          name: mapping.name,
          description: `Calidad superior en ${mapping.name}`,
          parentCategory: parentId,
          imageURL: "https://placehold.co/800x600.png"
        });
        console.log(`🌿 Hija creada: ${mapping.name} (Hija de ${mapping.parent})`);
      }
      categoryIdMap.set(upperKey, /** @type {ObjectId} */ (childDoc._id));
    }

    // 3. Preparar Productos
    /** @type {SyncProduct[]} */
    const allProductsToSync = [];

    sayerProducts.forEach(p => {
      if (!p.name || !p.category) return;
      const catId = categoryIdMap.get(p.category.trim().toUpperCase());
      if (catId) {
        // 🛡️ Sello Soberano: Concatenar subcategoría si existe para evitar duplicados (314 unique names -> 687 products)
        const fullName = p.subcategory 
          ? `${p.name.trim()} (${p.subcategory.trim()})`
          : p.name.trim();

        allProductsToSync.push({
          name: fullName,
          description: p.subcategory ? `Sayer-Lack - ${p.subcategory}` : "Calidad Sayer-Lack para tus proyectos.",
          price: parseSayerPrice(p.price),
          stock: 20, // Stock de seguridad piloto
          imagesUrl: p.local_image_path ? [p.local_image_path] : (p.image_url ? [p.image_url] : []),
          category: catId,
          soldCount: Math.floor(Math.random() * 50),
          brand: "Sayer-Lack",
          source: "Sayer-Lack"
        });
      }
    });

    tymcoProducts.forEach(p => {
      if (!p.name || !p.cat) return;
      const catId = categoryIdMap.get(p.cat.trim().toUpperCase());
      if (catId) {
        allProductsToSync.push({
          name: p.name.split("\n")[0].trim(),
          description: "Materiales de alta calidad distribuidos por TyMCO.",
          price: p.price > 0 ? p.price : 150,
          stock: 10, // Stock de seguridad piloto
          imagesUrl: p.img ? [p.img] : [],
          category: catId,
          soldCount: Math.floor(Math.random() * 30),
          brand: "TyMCO",
          source: "TyMCO"
        });
      }
    });

    console.log(`📝 Total a sincronizar: ${allProductsToSync.length} productos.`);

    // 4. Inserción por Chunks
    const CHUNK_SIZE = 50;
    for (let i = 0; i < allProductsToSync.length; i += CHUNK_SIZE) {
      const chunk = allProductsToSync.slice(i, i + CHUNK_SIZE);
      const ops = chunk.map(p => ({
        updateOne: { filter: { name: p.name }, update: { $set: p }, upsert: true }
      }));
      await Product.bulkWrite(ops);
      console.log(`⏳ Lote ${Math.floor(i / CHUNK_SIZE) + 1} completado...`);
      await new Promise(r => setTimeout(r, 400));
    }

    console.log("⭐ Sincronización 'Chingona' Completada con Éxito!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error CRÍTICO:", error);
    process.exit(1);
  }
}

massiveSync();