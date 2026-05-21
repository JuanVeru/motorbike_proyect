module.exports = (sequelize, DataTypes) => {
  const OrdenTrabajo = sequelize.define('OrdenTrabajo', {
    id_orden_trabajo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    id_moto: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_mecanico: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha_ingreso: {
      type: DataTypes.DATE,
      allowNull: false
    },
    fecha_entrega: {
      type: DataTypes.DATE,
      allowNull: true
    },
    diagnostico: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('Recepcion', 'Diagnostico', 'Cotizacion', 'Reparacion', 'Entregado'),
      allowNull: false
    },
    valor_mano_obra: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    total: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    id_responsible_user: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'ordenes_trabajo',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  OrdenTrabajo.associate = (models) => {
    OrdenTrabajo.belongsTo(models.Moto, { foreignKey: 'id_moto', as: 'moto' });
    OrdenTrabajo.belongsTo(models.User, { foreignKey: 'id_mecanico', as: 'mecanico' });
    OrdenTrabajo.belongsTo(models.User, { foreignKey: 'id_responsible_user', as: 'responsable' });
    OrdenTrabajo.hasMany(models.DetalleOrden, { foreignKey: 'id_orden_trabajo', as: 'detalles' });
  };

  return OrdenTrabajo;
};
