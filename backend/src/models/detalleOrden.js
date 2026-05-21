module.exports = (sequelize, DataTypes) => {
  const DetalleOrden = sequelize.define('DetalleOrden', {
    id_detalle_orden: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    id_orden_trabajo: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_repuesto: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DOUBLE,
      allowNull: false
    }
  }, {
    tableName: 'detalles_orden',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  DetalleOrden.associate = (models) => {
    DetalleOrden.belongsTo(models.OrdenTrabajo, { foreignKey: 'id_orden_trabajo', as: 'orden' });
    DetalleOrden.belongsTo(models.Repuesto, { foreignKey: 'id_repuesto', as: 'repuesto' });
  };

  return DetalleOrden;
};
