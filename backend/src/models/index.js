const { Sequelize } = require('sequelize');
const config = require('../config/sequelize-config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const User = require('./user')(sequelize, require('sequelize').DataTypes);
const Moto = require('./moto')(sequelize, require('sequelize').DataTypes);
const Repuesto = require('./repuesto')(sequelize, require('sequelize').DataTypes);
const OrdenTrabajo = require('./ordenTrabajo')(sequelize, require('sequelize').DataTypes);
const DetalleOrden = require('./detalleOrden')(sequelize, require('sequelize').DataTypes);

// Setup associations
User.associate({ Moto, Repuesto, OrdenTrabajo });
Moto.associate({ User, OrdenTrabajo });
Repuesto.associate({ User, DetalleOrden });
OrdenTrabajo.associate({ Moto, User, DetalleOrden });
DetalleOrden.associate({ OrdenTrabajo, Repuesto });

const db = {
  sequelize,
  Sequelize,
  User,
  Moto,
  Repuesto,
  OrdenTrabajo,
  DetalleOrden
};

module.exports = db;
