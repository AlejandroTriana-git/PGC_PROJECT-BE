import { DataTypes } from "sequelize";
import sequelize from "../config/database";

// aca se recrea la tabla `rol` del script SQL.
const Rol = sequelize.define(
  "Rol",
  {
    id_rol: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name_role: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
  },
  {
    tableName: "rol",
    timestamps: false,
  }
);

export default Rol;