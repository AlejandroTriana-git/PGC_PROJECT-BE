// aca verificamos quien es el usuario para asi poder ingresar gracias a los tokens

import jwt from "jsonwebtoken";
import { tokenEstaEnListaNegra } from "../repositories/authRepository.js";

// con esta funcion se verifica que halla un token valido para el ingreso y si no da el error 401 respectivamente
async function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
// aca se revisa que el header existe y que tenga un formato valido sino 401
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
// esto es para que no se caiga la app y verifica si la "firma" es igual a la original
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ mensaje: "Token inválido o expirado" });
  }

// aca se revisa que el token no este en la lista negra (sesion cerrada), si esta da 401
  try {
    const en_lista_negra = await tokenEstaEnListaNegra(token);
    if (en_lista_negra) {
      return res.status(401).json({ mensaje: "Sesión expirada. Por favor, inicie sesión nuevamente" });
    }
  } catch (error) {
    console.error("Error al consultar la lista negra:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }

  req.usuario = payload; // { id, mail_user, rol }
  next();
}

export default verificarToken;