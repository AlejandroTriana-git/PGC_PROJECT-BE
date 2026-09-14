import sequelize from "../config/database.js";
import Rol from "./rol.js";
import Usuario from "./usuario.js";
import Estudiante from "./estudiante.js";
import BlacklistedToken from "./blacklisted_token.js";
import Pgc from "./pgc.js";
import Propuesta from "./propuesta.js";
import Integrante from "./integrante.js";

// Rol 1-N Usuario
Rol.hasMany(Usuario, { foreignKey: "id_rol" });
Usuario.belongsTo(Rol, { foreignKey: "id_rol" });

// Usuario 1-N Estudiante 
Usuario.hasMany(Estudiante, { foreignKey: "id_user" });
Estudiante.belongsTo(Usuario, { foreignKey: "id_user" });

// Usuario 1-N BlacklistedToken
Usuario.hasMany(BlacklistedToken, { foreignKey: "id_user" });
BlacklistedToken.belongsTo(Usuario, { foreignKey: "id_user" });

// --- A partir de aqui, las tablas que todavia NO existen en el script SQL real
// Se dejan como temporal hasta que aljandro las defina.

// Estudiante 1-N Propuesta 
Estudiante.hasMany(Propuesta, { foreignKey: "estudiante_id" });
Propuesta.belongsTo(Estudiante, { foreignKey: "estudiante_id" });

// Pgc N-N Estudiante a traves de Integrante
Pgc.belongsToMany(Estudiante, { through: Integrante, foreignKey: "pgc_id" });
Estudiante.belongsToMany(Pgc, { through: Integrante, foreignKey: "estudiante_id" });

export {
  sequelize,
  Rol,
  Usuario,
  Estudiante,
  BlacklistedToken,
  Pgc,
  Propuesta,
  Integrante,
};