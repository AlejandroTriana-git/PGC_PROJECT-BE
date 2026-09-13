const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Propuesta inicial que radica el estudiante y que el encargado
// de ciclo aprueba o rechaza (HU-08). Al aprobarse, da origen a un Pgc.
// tabla inexistente aun en el script SQL.
const Propuesta = sequelize.define(
  "Propuesta",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    problema: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    justificacion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    objetivos: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    solucion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    estudiante_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "students", key: "id_student" },
    },
    estado: {
      type: DataTypes.ENUM("Pendiente", "Aprobada", "Rechazada"),
      allowNull: false,
      defaultValue: "Pendiente",
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "propuestas",
    timestamps: true,
  }
);

module.exports = Propuesta;