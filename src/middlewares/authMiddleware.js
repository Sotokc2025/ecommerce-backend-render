// @ts-check
import jwt from "jsonwebtoken";

/**
 * @typedef {Object} UserPayload
 * @property {string} userId
 * @property {string} role
 * 
 * @typedef {import('express').Request & { user?: UserPayload }} AuthRequest
 * @typedef {import('express').Response} ExpressResponse
 * @typedef {import('express').NextFunction} NextFunction
 * 
 * @typedef {(req: AuthRequest, res: ExpressResponse, next: NextFunction) => any} AuthRequestHandler
 */

/** @type {AuthRequestHandler} */
const authMiddleware = (req, res, next) => {
  let token = req.headers["authorization"]?.split(" ")[1];

  if (!token && req.cookies) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - Context 7: No token provided" });
  }

  const secret = process.env.JWT_SECRET || "default_secret";
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden - Context 7: Invalid or expired token" });
    }
    
    // Inyectamos el payload tipado.
    req.user = /** @type {UserPayload} */ (decoded);
    next();
  });
};

export default authMiddleware;
