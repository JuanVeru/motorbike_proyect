const { Repuesto } = require('../models');
const { Op } = require('sequelize');

class RepuestoRepository {
  async findAll(filters = {}) {
    const where = {};
    if (filters.referencia !== undefined && filters.referencia !== null && filters.referencia !== '') {
      where.referencia = { [Op.iLike]: `%${filters.referencia}%` };
    }
    if (filters.nombre !== undefined && filters.nombre !== null && filters.nombre !== '') {
      where.nombre = { [Op.iLike]: `%${filters.nombre}%` };
    }

    const options = {
      where,
      order: [['id_repuesto', 'ASC']]
    };

    if (filters.limit !== undefined && filters.limit !== null) {
      options.limit = filters.limit;
    }
    if (filters.offset !== undefined && filters.offset !== null) {
      options.offset = filters.offset;
    }

    const { rows, count } = await Repuesto.findAndCountAll(options);
    return {
      rows: rows.map(r => r.toJSON()),
      count
    };
  }

  async findById(id) {
    const repuesto = await Repuesto.findByPk(id);
    return repuesto ? repuesto.toJSON() : null;
  }

  async findByReferencia(referencia) {
    const repuesto = await Repuesto.findOne({
      where: { referencia }
    });
    return repuesto ? repuesto.toJSON() : null;
  }

  async create({ referencia, nombre, stock, precio, responsible_user }) {
    const repuesto = await Repuesto.create({
      referencia,
      nombre,
      stock,
      precio,
      responsible_user
    });
    return repuesto.toJSON();
  }

  async update(id, { referencia, nombre, stock, precio, responsible_user }) {
    const updateData = {};
    if (referencia !== undefined) updateData.referencia = referencia;
    if (nombre !== undefined) updateData.nombre = nombre;
    if (stock !== undefined) updateData.stock = stock;
    if (precio !== undefined) updateData.precio = precio;
    if (responsible_user !== undefined) updateData.responsible_user = responsible_user;

    const [affectedCount] = await Repuesto.update(updateData, {
      where: { id_repuesto: id }
    });

    if (affectedCount === 0) return null;

    const updatedRepuesto = await Repuesto.findByPk(id);
    return updatedRepuesto ? updatedRepuesto.toJSON() : null;
  }

  async delete(id) {
    const repuesto = await Repuesto.findByPk(id);
    if (!repuesto) return null;
    await repuesto.destroy();
    return repuesto.toJSON();
  }
}

module.exports = new RepuestoRepository();
