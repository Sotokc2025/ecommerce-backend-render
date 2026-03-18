import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function checkConnection() {
  console.log("🔍 Iniciando Validación de Conectividad TyMCO...");
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ ERROR: MONGODB_URI no definida en el .env");
    process.exit(1);
  }

  try {
    console.log("⏳ Conectando a MongoDB...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ CONEXIÓN EXITOSA: Base de datos 'maderas-db' es accesible.");
    
    // Validar nombre de la DB
    const dbName = mongoose.connection.name;
    console.log(`📡 Base de datos activa: ${dbName}`);
    
    if (dbName !== "maderas-db") {
      console.warn("⚠️ ADVERTENCIA: La base de datos no se llama 'maderas-db'. Revisa tu configuración.");
    }

    await mongoose.disconnect();
    console.log("🔒 Desconexión segura completada.");
    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR DE CONECTIVIDAD:");
    console.error(err.message);
    process.exit(1);
  }
}

checkConnection();
