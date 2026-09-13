const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// aca es una tabla puente donde que estudiantes conforman un PGC.
// inexistente aun en el script SQL.
const Integrante = sequelize.define(
  "Integrante",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pgc_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "pgc", key: "id" },
    },
    estudiante_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "students", key: "id_student" },
    },
    es_lider: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "integrantes",
    timestamps: false,
  }
);

module.exports = Integrante;