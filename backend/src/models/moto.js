module.exports = (sequelize, DataTypes) => {
  const Moto = sequelize.define('Moto', {
    placa: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    marca: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    modelo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    cilindraje: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    id_propietario: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    responsible_user: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    create_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'motos',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  Moto.associate = (models) => {
    Moto.belongsTo(models.User, { foreignKey: 'id_propietario', as: 'propietario' });
    Moto.belongsTo(models.User, { foreignKey: 'responsible_user', as: 'responsable' });
    Moto.hasMany(models.OrdenTrabajo, { foreignKey: 'id_moto', as: 'ordenesTrabajo' });
  };

  return Moto;
};
