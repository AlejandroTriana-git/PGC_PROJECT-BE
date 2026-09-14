import { DataTypes } from "sequelize";
import sequelize from "../config/database";

// aca se recrea la tabla `blacklisted_tokens` de la bd.
// Sirve para invalidar un JWT antes de que expire por si solo , basicamente cerrar sesion
const BlacklistedToken = sequelize.define(
  "BlacklistedToken",
  {
    id_token: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    id_user: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id_user" },
    },
    token: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "blacklisted_tokens",
    timestamps: false,
  }
);

export default BlacklistedToken;