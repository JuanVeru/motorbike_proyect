const { OrdenTrabajo, Moto, User, DetalleOrden, Repuesto } = require('../models');

class OrdenTrabajoRepository {
  async findAll(filters = {}) {
    const where = {};
    if (filters.id_moto !== undefined && filters.id_moto !== null && filters.id_moto !== '') {
      where.id_moto = filters.id_moto;
    }
    if (filters.id_mecanico !== undefined && filters.id_mecanico !== null && filters.id_mecanico !== '') {
      where.id_mecanico = filters.id_mecanico;
    }
    if (filters.estado !== undefined && filters.estado !== null && filters.estado !== '') {
      where.estado = filters.estado;
    }

    const options = {
      where,
      include: [
        { model: Moto, as: 'moto', attributes: ['placa'] },
        { model: User, as: 'mecanico', attributes: ['nombre'] }
      ],
      order: [['id_orden_trabajo', 'ASC']]
    };

    if (filters.limit !== undefined && filters.limit !== null) {
      options.limit = filters.limit;
    }
    if (filters.offset !== undefined && filters.offset !== null) {
      options.offset = filters.offset;
    }

    const { rows, count } = await OrdenTrabajo.findAndCountAll(options);
    return {
      rows: rows.map(r => r.toJSON()),
      count
    };
  }

  async findById(id) {
    const order = await OrdenTrabajo.findByPk(id, {
      include: [
        { model: Moto, as: 'moto', attributes: ['placa'] },
        { model: User, as: 'mecanico', attributes: ['nombre'] },
        {
          model: DetalleOrden,
          as: 'detalles',
          include: [
            { model: Repuesto, as: 'repuesto', attributes: ['nombre'] }
          ]
        }
      ]
    });
    return order ? order.toJSON() : null;
  }

  async create(orderData, detailsData = [], { transaction } = {}) {
    const order = await OrdenTrabajo.create(orderData, { transaction });
    
    const details = [];
    for (const d of detailsData) {
      const detail = await DetalleOrden.create({
        id_orden_trabajo: order.id_orden_trabajo,
        id_repuesto: d.id_repuesto,
        cantidad: d.cantidad,
        subtotal: d.subtotal
      }, { transaction });
      details.push(detail);
    }

    return {
      ...order.toJSON(),
      detalles: details.map(d => d.toJSON())
    };
  }

  async update(id, orderData, detailsData = [], { transaction } = {}) {
    await OrdenTrabajo.update(orderData, {
      where: { id_orden_trabajo: id },
      transaction
    });

    // Delete existing details
    await DetalleOrden.destroy({
      where: { id_orden_trabajo: id },
      transaction
    });

    // Create new details
    const details = [];
    for (const d of detailsData) {
      const detail = await DetalleOrden.create({
        id_orden_trabajo: id,
        id_repuesto: d.id_repuesto,
        cantidad: d.cantidad,
        subtotal: d.subtotal
      }, { transaction });
      details.push(detail);
    }

    const updated = await OrdenTrabajo.findByPk(id, {
      include: [
        { model: Moto, as: 'moto', attributes: ['placa'] },
        { model: User, as: 'mecanico', attributes: ['nombre'] },
        {
          model: DetalleOrden,
          as: 'detalles',
          include: [
            { model: Repuesto, as: 'repuesto', attributes: ['nombre'] }
          ]
        }
      ],
      transaction
    });

    return updated ? updated.toJSON() : null;
  }

  async delete(id, { transaction } = {}) {
    // DetalleOrden is set to ON DELETE CASCADE at database/migration level,
    // but destroying it explicitly under the transaction is safe and clean.
    await DetalleOrden.destroy({
      where: { id_orden_trabajo: id },
      transaction
    });

    const deletedCount = await OrdenTrabajo.destroy({
      where: { id_orden_trabajo: id },
      transaction
    });

    return deletedCount > 0;
  }
}

module.exports = new OrdenTrabajoRepository();
