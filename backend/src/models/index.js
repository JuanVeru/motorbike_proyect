const { Sequelize } = require('sequelize');
const config = require('../config/sequelize-config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (dbConfig.use_env_variable && process.env[dbConfig.use_env_variable]) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: dbConfig.dialectOptions || {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

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
