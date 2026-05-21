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

// Setup associations
User.associate({ Moto, Repuesto });
Moto.associate({ User });
Repuesto.associate({ User });

const db = {
  sequelize,
  Sequelize,
  User,
  Moto,
  Repuesto
};

module.exports = db;
