import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../src/models/user.js";

dotenv.config();

async function resetPasswords() {
    try {
        let dbUri = process.env.MONGODB_URI;
        const isPartnerPC = process.env.COMPUTERNAME === 'YERIKOPC';

        if (isPartnerPC) {
            console.log("☁️ Entorno de PartnerPC (YERIKOPC) detectado. Usando conexión a MongoDB Atlas...");
            // Usamos lo que está en MONGODB_URI (Atlas)
        } else {
            console.log("⚠️ Entorno de Karlita / Local detectado. Forzando conexión a MongoDB Local...");
            dbUri = "mongodb://127.0.0.1:27017/maderas-db";
        }

        await mongoose.connect(dbUri);
        console.log(`🚀 Conectado a MongoDB para reset de claves en: ${isPartnerPC ? 'ATLAS' : 'LOCAL'}...`);

        const saltRounds = 10;
        const adminHash = await bcrypt.hash("admin123", saltRounds);
        const clienteHash = await bcrypt.hash("cliente123", saltRounds);

        // Actualizar o crear usuarios de prueba con claves conocidas
        await User.findOneAndUpdate(
            { email: "admin@email.com" },
            { hashPassword: adminHash, role: "admin", displayName: "Admin Partner" },
            { upsert: true }
        );

        await User.findOneAndUpdate(
            { email: "cliente@email.com" },
            { hashPassword: clienteHash, role: "guest", displayName: "Cliente Prueba" },
            { upsert: true }
        );

        const karlitaHash = await bcrypt.hash("AdminPass123!", saltRounds);
        await User.findOneAndUpdate(
            { email: "admin@tymco.local" },
            { hashPassword: karlitaHash, role: "admin", displayName: "Karlita Admin" },
            { upsert: true }
        );

        // También actualizar a Karlita para que pueda entrar con su clave si la recuerda (o ponerle una)
        // Por ahora dejemos a los de prueba.

        console.log("✅ Claves de prueba reseteadas: admin123 / cliente123");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetPasswords();