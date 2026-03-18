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
import routes from "./src/routes/index.js";

// Configurar manejadores globales ANTES de crear la app
setupGlobalErrorHandlers();

export const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001', 'http://localhost:5173', 'http://127.0.0.1:5173'];

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
app.use(logger);

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

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "E-commerce API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api",
    },
  });
});

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
