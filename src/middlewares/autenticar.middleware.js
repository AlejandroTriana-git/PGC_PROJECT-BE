// aca verificamos quien es el usuario para asi poder ingresar gracias a los tokens

import jwt from "jsonwebtoken";

// con esta funcion se verifica que halla un token valido para el ingreso y si no da el error 401 respectivamente
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
// aca se revisa que el header existe y que tenga un formato valido sino 401
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
// esto es para que no se caiga la app y verifica si la "firma" es igual a la original
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, correo, rol }
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
}

export default verificarToken;
