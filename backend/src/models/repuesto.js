module.exports = (sequelize, DataTypes) => {
  const Repuesto = sequelize.define('Repuesto', {
    id_repuesto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    referencia: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    precio: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    responsible_user: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'repuestos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Repuesto.associate = (models) => {
    Repuesto.belongsTo(models.User, { foreignKey: 'responsible_user', as: 'responsable' });
  };

  return Repuesto;
};
