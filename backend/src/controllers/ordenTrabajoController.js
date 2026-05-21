const { sequelize, Repuesto } = require('../models');
const ordenTrabajoRepository = require('../repositories/ordenTrabajoRepository');
const motoRepository = require('../repositories/motoRepository');
const userRepository = require('../repositories/userRepository');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

class OrdenTrabajoController {
  async getAll(req, res) {
    try {
      const { id_moto, id_mecanico, estado } = req.query;
      const { limit, offset, page } = getPaginationParams(req.query);

      const { rows, count } = await ordenTrabajoRepository.findAll({
        id_moto,
        id_mecanico,
        estado,
        limit,
        offset
      });

      const formattedRows = rows.map(r => ({
        id_orden_trabajo: r.id_orden_trabajo,
        id_moto: r.id_moto,
        placa_moto: r.moto ? r.moto.placa : null,
        id_mecanico: r.id_mecanico,
        nombre_mecanico: r.mecanico ? r.mecanico.nombre : null,
        fecha_ingreso: r.fecha_ingreso,
        fecha_entrega: r.fecha_entrega,
        estado: r.estado,
        total: r.total
      }));

      const paginatedResponse = buildPaginatedResponse(formattedRows, count, page, limit);
      res.json(paginatedResponse);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las órdenes de trabajo: ' + error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const order = await ordenTrabajoRepository.findById(id);
      if (!order) {
        return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
      }

      const formatted = {
        id_orden_trabajo: order.id_orden_trabajo,
        id_moto: order.id_moto,
        placa_moto: order.moto ? order.moto.placa : null,
        id_mecanico: order.id_mecanico,
        nombre_mecanico: order.mecanico ? order.mecanico.nombre : null,
        fecha_ingreso: order.fecha_ingreso,
        fecha_entrega: order.fecha_entrega,
        diagnostico: order.diagnostico,
        estado: order.estado,
        valor_mano_obra: order.valor_mano_obra,
        total: order.total,
        id_responsible_user: order.id_responsible_user,
        detalleOrden: (order.detalles || []).map(d => ({
          id_detallerOrden: d.id_detalle_orden,
          id_orden: d.id_orden_trabajo,
          id_repuesto: d.id_repuesto,
          nombre_Respuesto: d.repuesto ? d.repuesto.nombre : null,
          nombre_repuesto: d.repuesto ? d.repuesto.nombre : null,
          cantidad: d.cantidad,
          subtotal: d.subtotal
        }))
      };

      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la orden de trabajo: ' + error.message });
    }
  }

  async create(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const {
        id_moto,
        id_mecanico,
        fecha_ingreso,
        diagnostico,
        valor_mano_obra,
        detalleOrden = []
      } = req.body;

      // 1. Validar presencia
      if (
        id_moto === undefined || id_moto === null ||
        id_mecanico === undefined || id_mecanico === null ||
        fecha_ingreso === undefined || fecha_ingreso === null ||
        diagnostico === undefined || diagnostico === null ||
        valor_mano_obra === undefined || valor_mano_obra === null
      ) {
        return res.status(400).json({
          error: 'Los campos son obligatorios: id_moto, id_mecanico, fecha_ingreso, diagnostico, valor_mano_obra'
        });
      }

      // 2. Validar que diagnostico no sea vacío
      if (typeof diagnostico !== 'string' || diagnostico.trim() === '') {
        return res.status(400).json({ error: 'El campo diagnostico no puede estar vacío' });
      }

      // 3. Validar valor_mano_obra
      if (typeof valor_mano_obra !== 'number' || isNaN(valor_mano_obra)) {
        return res.status(400).json({ error: 'El campo valor_mano_obra debe ser un número válido' });
      }
      if (valor_mano_obra < 0) {
        return res.status(400).json({ error: 'El valor de la mano de obra no puede ser negativo' });
      }

      // 4. Validar que la moto exista
      const moto = await motoRepository.findById(id_moto);
      if (!moto) {
        return res.status(404).json({ error: 'La moto especificada no existe' });
      }

      // 5. Validar que el mecánico exista, esté activo y tenga rol empleado
      const mecanico = await userRepository.findById(id_mecanico);
      if (!mecanico) {
        return res.status(404).json({ error: 'El mecánico especificado no existe' });
      }
      if (mecanico.rol !== 'empleado') {
        return res.status(400).json({ error: 'El usuario asignado como mecánico debe tener el rol de empleado' });
      }
      if (!mecanico.is_active) {
        return res.status(400).json({ error: 'El mecánico asignado no está activo' });
      }

      // 6. Validar y procesar detalles de repuestos
      let computedTotal = valor_mano_obra;
      const processedDetails = [];

      for (const item of detalleOrden) {
        const { id_repuesto, cantidad } = item;
        if (id_repuesto === undefined || id_repuesto === null) {
          throw new Error('El id_repuesto es obligatorio en el detalle de la orden');
        }
        if (cantidad === undefined || cantidad === null || typeof cantidad !== 'number' || cantidad < 0 || !Number.isInteger(cantidad)) {
          throw new Error('La cantidad es obligatoria, debe ser un número entero y no puede ser negativa');
        }

        // Obtener repuesto bajo la transacción
        const repuesto = await Repuesto.findByPk(id_repuesto, { transaction });
        if (!repuesto) {
          throw new Error(`Repuesto con ID ${id_repuesto} no encontrado`);
        }

        if (cantidad > repuesto.stock) {
          throw new Error(`Stock insuficiente para el repuesto "${repuesto.nombre}". Stock disponible: ${repuesto.stock}, solicitado: ${cantidad}`);
        }

        const subtotal = repuesto.precio * cantidad;
        computedTotal += subtotal;

        // Descontar del stock
        await repuesto.update({ stock: repuesto.stock - cantidad }, { transaction });

        processedDetails.push({
          id_repuesto,
          cantidad,
          subtotal
        });
      }

      const orderData = {
        id_moto,
        id_mecanico,
        fecha_ingreso,
        fecha_entrega: null,
        diagnostico: diagnostico.trim(),
        estado: 'Recepcion',
        valor_mano_obra,
        total: computedTotal,
        id_responsible_user: req.user.id
      };

      const createdOrder = await ordenTrabajoRepository.create(orderData, processedDetails, { transaction });

      await transaction.commit();
      res.status(201).json({
        message: 'Orden de trabajo creada exitosamente',
        orden: {
          id_orden_trabajo: createdOrder.id_orden_trabajo,
          id_moto: createdOrder.id_moto,
          id_mecanico: createdOrder.id_mecanico,
          fecha_ingreso: createdOrder.fecha_ingreso,
          fecha_entrega: createdOrder.fecha_entrega,
          diagnostico: createdOrder.diagnostico,
          estado: createdOrder.estado,
          valor_mano_obra: createdOrder.valor_mano_obra,
          total: createdOrder.total,
          id_responsible_user: createdOrder.id_responsible_user,
          detalleOrden: (createdOrder.detalles || []).map(d => ({
            id_detallerOrden: d.id_detalle_orden,
            id_orden: d.id_orden_trabajo,
            id_repuesto: d.id_repuesto,
            cantidad: d.cantidad,
            subtotal: d.subtotal
          }))
        }
      });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const {
        id_moto,
        id_mecanico,
        fecha_ingreso,
        diagnostico,
        estado,
        valor_mano_obra,
        detalleOrden = []
      } = req.body;

      // 1. Validar presencia
      if (
        id_moto === undefined || id_moto === null ||
        id_mecanico === undefined || id_mecanico === null ||
        fecha_ingreso === undefined || fecha_ingreso === null ||
        diagnostico === undefined || diagnostico === null ||
        estado === undefined || estado === null ||
        valor_mano_obra === undefined || valor_mano_obra === null
      ) {
        return res.status(400).json({
          error: 'Los campos son obligatorios: id_moto, id_mecanico, fecha_ingreso, diagnostico, estado, valor_mano_obra'
        });
      }

      // 2. Validar que diagnostico no sea vacío
      if (typeof diagnostico !== 'string' || diagnostico.trim() === '') {
        return res.status(400).json({ error: 'El campo diagnostico no puede estar vacío' });
      }

      // 3. Validar valor_mano_obra
      if (typeof valor_mano_obra !== 'number' || isNaN(valor_mano_obra)) {
        return res.status(400).json({ error: 'El campo valor_mano_obra debe ser un número válido' });
      }
      if (valor_mano_obra < 0) {
        return res.status(400).json({ error: 'El valor de la mano de obra no puede ser negativo' });
      }

      // 4. Validar estado válido
      const validEstados = ['Recepcion', 'Diagnostico', 'Cotizacion', 'Reparacion', 'Entregado'];
      if (!validEstados.includes(estado)) {
        return res.status(400).json({ error: `Estado inválido. Debe ser uno de: ${validEstados.join(', ')}` });
      }

      // 5. Validar que la orden exista y su estado actual no sea Entregado
      const currentOrder = await ordenTrabajoRepository.findById(id);
      if (!currentOrder) {
        return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
      }
      if (currentOrder.estado === 'Entregado') {
        return res.status(400).json({ error: 'Si la orden tiene estado entregado ya no se puede actualizar' });
      }

      // 6. Validar que la moto exista
      const moto = await motoRepository.findById(id_moto);
      if (!moto) {
        return res.status(404).json({ error: 'La moto especificada no existe' });
      }

      // 7. Validar que el mecánico exista, esté activo y tenga rol empleado
      const mecanico = await userRepository.findById(id_mecanico);
      if (!mecanico) {
        return res.status(404).json({ error: 'El mecánico especificado no existe' });
      }
      if (mecanico.rol !== 'empleado') {
        return res.status(400).json({ error: 'El usuario asignado como mecánico debe tener el rol de empleado' });
      }
      if (!mecanico.is_active) {
        return res.status(400).json({ error: 'El mecánico asignado no está activo' });
      }

      // 8. Devolver stock de repuestos de los detalles anteriores en esta transacción
      for (const oldDetail of currentOrder.detalles || []) {
        const repuesto = await Repuesto.findByPk(oldDetail.id_repuesto, { transaction });
        if (repuesto) {
          await repuesto.update({ stock: repuesto.stock + oldDetail.cantidad }, { transaction });
        }
      }

      // 9. Validar y descontar stock de los nuevos repuestos
      let computedTotal = valor_mano_obra;
      const processedDetails = [];

      for (const item of detalleOrden) {
        const { id_repuesto, cantidad } = item;
        if (id_repuesto === undefined || id_repuesto === null) {
          throw new Error('El id_repuesto es obligatorio en el detalle de la orden');
        }
        if (cantidad === undefined || cantidad === null || typeof cantidad !== 'number' || cantidad < 0 || !Number.isInteger(cantidad)) {
          throw new Error('La cantidad es obligatoria, debe ser un número entero y no puede ser negativa');
        }

        const repuesto = await Repuesto.findByPk(id_repuesto, { transaction });
        if (!repuesto) {
          throw new Error(`Repuesto con ID ${id_repuesto} no encontrado`);
        }

        if (cantidad > repuesto.stock) {
          throw new Error(`Stock insuficiente para el repuesto "${repuesto.nombre}". Stock disponible (restaurado): ${repuesto.stock}, solicitado: ${cantidad}`);
        }

        const subtotal = repuesto.precio * cantidad;
        computedTotal += subtotal;

        // Descontar del stock restaurado
        await repuesto.update({ stock: repuesto.stock - cantidad }, { transaction });

        processedDetails.push({
          id_repuesto,
          cantidad,
          subtotal
        });
      }

      // Calcular fecha_entrega (si se pasa a Entregado toma fecha actual, sino queda null o conserva valor previo si se desea)
      const fecha_entrega = estado === 'Entregado' ? new Date() : currentOrder.fecha_entrega;

      const orderData = {
        id_moto,
        id_mecanico,
        fecha_ingreso,
        fecha_entrega,
        diagnostico: diagnostico.trim(),
        estado,
        valor_mano_obra,
        total: computedTotal
      };

      const updated = await ordenTrabajoRepository.update(id, orderData, processedDetails, { transaction });

      await transaction.commit();
      res.json({
        message: 'Orden de trabajo actualizada exitosamente',
        orden: {
          id_orden_trabajo: updated.id_orden_trabajo,
          id_moto: updated.id_moto,
          id_mecanico: updated.id_mecanico,
          fecha_ingreso: updated.fecha_ingreso,
          fecha_entrega: updated.fecha_entrega,
          diagnostico: updated.diagnostico,
          estado: updated.estado,
          valor_mano_obra: updated.valor_mano_obra,
          total: updated.total,
          id_responsible_user: updated.id_responsible_user,
          detalleOrden: (updated.detalles || []).map(d => ({
            id_detallerOrden: d.id_detalle_orden,
            id_orden: d.id_orden_trabajo,
            id_repuesto: d.id_repuesto,
            cantidad: d.cantidad,
            subtotal: d.subtotal
          }))
        }
      });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;

      const order = await ordenTrabajoRepository.findById(id);
      if (!order) {
        return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
      }

      // Devolver stock de repuestos al inventario
      for (const detail of order.detalles || []) {
        const repuesto = await Repuesto.findByPk(detail.id_repuesto, { transaction });
        if (repuesto) {
          await repuesto.update({ stock: repuesto.stock + detail.cantidad }, { transaction });
        }
      }

      await ordenTrabajoRepository.delete(id, { transaction });

      await transaction.commit();
      res.json({ message: 'Orden de trabajo eliminada exitosamente' });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ error: 'Error al eliminar la orden de trabajo: ' + error.message });
    }
  }
}

module.exports = new OrdenTrabajoController();
