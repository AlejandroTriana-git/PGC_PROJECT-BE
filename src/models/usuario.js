const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// aca se recrea la tabla `users` del script SQL.
// advertencia: esta tabla no tiene columna de nombre ni de "activo" 
const Usuario = sequelize.define(
  "Usuario",
  {
    id_user: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    id_rol: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "rol", key: "id_rol" },
    },
    mail_user: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_user: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "users",
    timestamps: false,
  }
);

module.exports = Usuario;