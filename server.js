import "dotenv/config";
import cors from 'cors'
import express from "express";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import mongoose from "mongoose";
import dbConnection from "./src/config/database.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import setupGlobalErrorHandlers from "./src/middlewares/globalErrorHandler.js";
import logger from "./src/middlewares/logger.js";
import { apiLimiter } from "./src/middlewares/rateLimiter.js";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swagger.js';
import cookieParser from 'cookie-parser';
import routes from "./src/routes/index.js";

// Configurar manejadores globales ANTES de crear la app
setupGlobalErrorHandlers();

export const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(origin => origin !== "");

// Fallback si no hay variables de entorno (solo desarrollo)
if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173');
}

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Middlewares de seguridad
app.use(helmet());

// Middlewares en el orden correcto
app.use(express.json());
app.use(cookieParser());
app.use(logger);

// Configurar Pug
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "src/views"));

// Rate limiting global para toda la API
app.use("/api", apiLimiter);

// Health check endpoint
app.get("/health", async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    status: "OK",
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  };
  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.status = "ERROR";
    res.status(503).json(healthcheck);
  }
});

// Ruta raíz - IT'S ALIVE!!
app.get("/", (req, res) => {
  res.render("alive");
});

// Health Status Dashboard
app.get("/status", (req, res) => {
  const db_status = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  const db_name = mongoose.connection.name || 'maderas-db';
  const db_user = process.env.MONGODB_USER || 'karlitasoto2026_db_user';
  const uptime = Math.floor(process.uptime());

  res.render("status", {
    db_status,
    db_name,
    db_user,
    uptime
  });
});

// Documentación Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    url: req.originalUrl,
  });
});
// El errorHandler debe ir AL FINAL, después de todas las rutas
app.use(errorHandler);

const startServer = async () => {
  try {
    await dbConnection();

    if (process.env.NODE_ENV !== "production") {
      try {
        const { ensureAdmin } = await import("./src/seed/ensureAdmin.js");
        await ensureAdmin();
      } catch (err) {
        console.error("ensureAdmin error:", err);
      }
    }

    const port = process.env.SRV_PORT || process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();