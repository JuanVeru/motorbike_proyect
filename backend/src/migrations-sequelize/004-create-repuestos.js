module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('repuestos', {
      id_repuesto: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      referencia: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      nombre: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      precio: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      responsible_user: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('repuestos');
  }
};
