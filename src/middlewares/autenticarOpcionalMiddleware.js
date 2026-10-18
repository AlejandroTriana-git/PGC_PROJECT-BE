// aca va la version "opcional" de verificarToken, para las rutas publicas (buscar PGC y ver la ficha)

import jwt from "jsonwebtoken";
import { tokenEnListaNegra } from "../repositories/authRepository.js";

// esta funcion deja pasar SIEMPRE: si llega un token valido llena req.usuario, si no llega o esta vencido
// sigue como visitante (req.usuario = null) en vez de responder 401
async function verificarTokenOpcional(req, res, next) {
  req.usuario = null;
  const authHeader = req.headers.authorization;

  // aca si no hay header se sigue como visitante
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // aca un token cerrado con logout tambien cuenta como visitante
    if (!(await tokenEnListaNegra(token))) {
      req.usuario = payload;
    }
  } catch (error) {
    // token invalido o vencido: se ignora y se sigue como visitante
  }
  next();
}

export default verificarTokenOpcional;