import { DataTypes } from "sequelize";
import sequelize from "../config/database";

// aca se recrea la tabla `students` de la bd.
// revisar: id_user aqui NO tiene UNIQUE en el script para bd, o sea que a nivel de
// BD un mismo usuario podria tener varios registros de estudiante?? (pero si es uno
// por ciclo, ya existe el pgc_cycle, no?).
const Estudiante = sequelize.define(
  "Estudiante",
  {
    id_student: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    id_user: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id_user" },
    },
    name_student: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    pgc_cycle: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    tableName: "students",
    timestamps: false,
  }
);

export default Estudiante;