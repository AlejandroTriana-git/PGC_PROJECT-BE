const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Verificar formato "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensaje: "Token no proporcionado o formato inválido" });
  }

  // 2. Extraer el token y asegurar que no venga vacío
  const token = authHeader.split(" ")[1]?.trim();
  if (!token) {
    return res.status(401).json({ mensaje: "Token vacío" });
  }

  // 3. Asegurar que la clave secreta esté configurada
  if (!process.env.JWT_SECRET) {
    console.error("Falta configurar JWT_SECRET en las variables de entorno");
    return res.status(500).json({ mensaje: "Error interno de configuración" });
  }

  // 4. Verificar la firma y expiración del token
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, mail_user, rol }
    return next();
  } catch {
    return res.status(401).json({ mensaje: "Token inválido o expirado" });
  }}

module.exports = verificarToken;
