const { User } = require('../models');
const bcrypt = require('bcryptjs');

class UserRepository {
  async findAll(isActive = null, rol = null, limit = null, offset = null) {
    const where = {};
    if (isActive !== null) {
      where.is_active = isActive;
    }
    if (rol) {
      where.rol = rol;
    }
    const options = {
      where,
      attributes: ['id', 'nombre', 'correo', 'cedula', 'telefono', 'rol', 'is_active'],
      order: [['id', 'ASC']]
    };

    if (limit !== null) {
      options.limit = limit;
    }
    if (offset !== null) {
      options.offset = offset;
    }

    const { rows, count } = await User.findAndCountAll(options);
    return {
      rows: rows.map(u => u.toJSON()),
      count
    };
  }

  async findById(id) {
    const user = await User.findByPk(id, {
      attributes: ['id', 'nombre', 'correo', 'cedula', 'telefono', 'rol', 'is_active']
    });
    return user ? user.toJSON() : null;
  }

  async findByEmail(email) {
    const user = await User.findOne({
      where: { correo: email },
      attributes: ['id', 'nombre', 'correo', 'cedula', 'telefono', 'rol', 'is_active']
    });
    return user ? user.toJSON() : null;
  }

  async findByCedula(cedula) {
    const user = await User.findOne({
      where: { cedula },
      attributes: ['id', 'nombre', 'correo', 'cedula', 'telefono', 'rol', 'is_active']
    });
    return user ? user.toJSON() : null;
  }

  async findByEmailWithPassword(email) {
    const user = await User.findOne({
      where: { correo: email }
    });
    return user ? user.toJSON() : null;
  }

  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  async create({ nombre, correo, cedula, telefono, password, rol, is_active = true }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      nombre,
      correo,
      cedula,
      telefono,
      password: hashedPassword,
      rol,
      is_active
    });
    return user.toJSON();
  }

  async update(id, { nombre, correo, cedula, telefono, password, is_active }) {
    const updateData = { nombre, correo };
    if (cedula !== undefined) updateData.cedula = cedula;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    const user = await User.update(updateData, {
      where: { id },
      returning: true
    });

    if (user[0] === 0) return null;
    const updatedUser = await User.findByPk(id, {
      attributes: ['id', 'nombre', 'correo', 'cedula', 'telefono', 'rol', 'is_active']
    });
    return updatedUser ? updatedUser.toJSON() : null;
  }

  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.destroy();
    return user.toJSON();
  }

}

module.exports = new UserRepository();