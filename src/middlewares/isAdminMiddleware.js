// @ts-check
/**
 * Middleware para restringir acceso solo a roles de Administrador.
 * Implementa el estándar Context 7 Senior.
 * 
 * @type {import('./authMiddleware').AuthRequestHandler}
 */
const isAdmin = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ message: "Context 7: User authentication required" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required to this resource" });
  }

  next();
};

export default isAdmin;