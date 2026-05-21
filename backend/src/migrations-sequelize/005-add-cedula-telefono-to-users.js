module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'cedula', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
      defaultValue: ''
    });
    await queryInterface.addColumn('users', 'telefono', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: ''
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'cedula');
    await queryInterface.removeColumn('users', 'telefono');
  }
};
