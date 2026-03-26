// @ts-check
import User from "../models/user.js";
import bcrypt from "bcrypt";

export const ensureAdmin = async () => {
  try {
    const adminEmail = process.env.DEV_ADMIN_EMAIL;
    const adminPassword = process.env.DEV_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn("⚠️ No se definieron credenciales de Admin en el .env. Saltando creación.");
      return;
    }

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log("Admin user exists:", adminEmail);
      return;
    }

    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(adminPassword, saltRounds);

    const admin = new User({
      displayName: "Admin",
      email: adminEmail,
      hashPassword,
      role: "admin",
      avatar: "https://placehold.co/100x100.png",
      isActive: true,
    });

    await admin.save();
    console.log("Admin user created:", adminEmail);
    console.log("Password:", adminPassword);
  } catch (err) {
    console.error("Error ensuring admin user:", err);
    throw err;
  }
};
