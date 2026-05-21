const { User } = require('../models');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({
      where: { rol: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin ya existe, no se crea nuevo admin');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await User.create({
      nombre: 'Admin',
      correo: 'admin@motorbike.com',
      cedula: '0000000000',
      telefono: '0000000000',
      password: hashedPassword,
      rol: 'admin',
      is_active: true
    });

    console.log('Admin creado exitosamente con ID:', admin.id);
    console.log('Email: admin@motorbike.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creando admin:', error);
  }
};

module.exports = seedAdmin;
