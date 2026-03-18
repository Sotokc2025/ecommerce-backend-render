import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const errorHandler = (err, req, res, next) => {
  const logFilePath = path.join(__dirname, "../../logs/error.log");
  const dateTime = new Date();
  const logMessage = `${dateTime.toISOString()} | ${req.method} ${req.url} | ${err.message} | ${err.stack}\n`;

  // Crear directorio si no existe
  const logDir = path.dirname(logFilePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFile(logFilePath, logMessage, (fsErr) => {
    if (fsErr) {
      console.error("Failed to write into log file:", fsErr);
    }
  });

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const isServerError = statusCode >= 500;
  const response = {
    status: "error",
    message: isServerError ? "Internal Server Error" : err.message || "Error",
  };

  if (err.errors && !isServerError) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
