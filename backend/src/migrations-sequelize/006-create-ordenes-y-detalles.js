module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Crear tabla ordenes_trabajo
    await queryInterface.createTable('ordenes_trabajo', {
      id_orden_trabajo: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_moto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'motos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      id_mecanico: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      fecha_ingreso: {
        type: Sequelize.DATE,
        allowNull: false
      },
      fecha_entrega: {
        type: Sequelize.DATE,
        allowNull: true
      },
      diagnostico: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('Recepcion', 'Diagnostico', 'Cotizacion', 'Reparacion', 'Entregado'),
        allowNull: false
      },
      valor_mano_obra: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      total: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      id_responsible_user: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. Crear tabla detalles_orden
    await queryInterface.createTable('detalles_orden', {
      id_detalle_orden: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_orden_trabajo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ordenes_trabajo',
          key: 'id_orden_trabajo'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_repuesto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'repuestos',
          key: 'id_repuesto'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      subtotal: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('detalles_orden');
    await queryInterface.dropTable('ordenes_trabajo');
    // Drop custom ENUM types in Postgres so undoing migration does not leave orphans
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ordenes_trabajo_estado";');
  }
};
