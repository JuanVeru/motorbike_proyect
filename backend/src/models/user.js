module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    correo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rol: {
      type: DataTypes.ENUM('admin', 'empleado', 'cliente'),
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    cedula: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: false
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  User.associate = (models) => {
    User.hasMany(models.Moto, { foreignKey: 'id_propietario', as: 'motosPropias' });
    User.hasMany(models.Moto, { foreignKey: 'responsible_user', as: 'motosResponsables' });
    User.hasMany(models.Repuesto, { foreignKey: 'responsible_user', as: 'repuestosResponsables' });
    User.hasMany(models.OrdenTrabajo, { foreignKey: 'id_mecanico', as: 'ordenesAsignadas' });
    User.hasMany(models.OrdenTrabajo, { foreignKey: 'id_responsible_user', as: 'ordenesResponsables' });
  };

  return User;
};
