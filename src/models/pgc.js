import { DataTypes } from "sequelize";
import sequelize from "../config/database";

// Campos segun reglas ya definidas:
// Titulo, Problema, Justificacion, Objetivos, Solucion quedan de solo lectura
// tras la aprobacion de la idea; el lider solo edita Tecnologias e Integrantes.
// tabla inexistente aun en el script SQL.
const Pgc = sequelize.define(
  "Pgc",
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
    tecnologias: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "En Proceso",
    },
    ciclo: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    materia: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "pgc",
    timestamps: true,
  }
);

export default Pgc;