const { sequelize, Repuesto } = require('../models');
const PDFDocument = require('pdfkit');
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
        diagnostico: r.diagnostico,
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

      // 2. Validar que no haya repuestos duplicados en el cuerpo
      const repuestoIds = detalleOrden.map(d => d.id_repuesto);
      const uniqueRepuestoIds = new Set(repuestoIds);
      if (repuestoIds.length !== uniqueRepuestoIds.size) {
        return res.status(400).json({ error: 'No se permiten repuestos duplicados en el detalle de la orden' });
      }

      // 3. Validar que diagnostico no sea vacío
      if (typeof diagnostico !== 'string' || diagnostico.trim() === '') {
        return res.status(400).json({ error: 'El campo diagnostico no puede estar vacío' });
      }

      // 4. Validar valor_mano_obra
      if (typeof valor_mano_obra !== 'number' || isNaN(valor_mano_obra)) {
        return res.status(400).json({ error: 'El campo valor_mano_obra debe ser un número válido' });
      }
      if (valor_mano_obra < 0) {
        return res.status(400).json({ error: 'El valor de la mano de obra no puede ser negativo' });
      }

      // 5. Validar que la moto exista
      const moto = await motoRepository.findById(id_moto);
      if (!moto) {
        return res.status(404).json({ error: 'La moto especificada no existe' });
      }

      // 6. Validar que el mecánico exista, esté activo y tenga rol empleado
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

      // 7. Validar y procesar detalles de repuestos
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
        id_mecanico,
        fecha_ingreso,
        diagnostico,
        estado,
        valor_mano_obra,
        detalleOrden = []
      } = req.body;

      // 1. Validar presencia (id_moto NO se pasa)
      if (
        id_mecanico === undefined || id_mecanico === null ||
        fecha_ingreso === undefined || fecha_ingreso === null ||
        diagnostico === undefined || diagnostico === null ||
        estado === undefined || estado === null ||
        valor_mano_obra === undefined || valor_mano_obra === null
      ) {
        return res.status(400).json({
          error: 'Los campos son obligatorios: id_mecanico, fecha_ingreso, diagnostico, estado, valor_mano_obra'
        });
      }

      // 2. Validar que no haya repuestos duplicados
      const repuestoIds = detalleOrden.map(d => d.id_repuesto);
      const uniqueRepuestoIds = new Set(repuestoIds);
      if (repuestoIds.length !== uniqueRepuestoIds.size) {
        return res.status(400).json({ error: 'No se permiten repuestos duplicados en el detalle de la orden' });
      }

      // 3. Validar que diagnostico no sea vacío
      if (typeof diagnostico !== 'string' || diagnostico.trim() === '') {
        return res.status(400).json({ error: 'El campo diagnostico no puede estar vacío' });
      }

      // 4. Validar valor_mano_obra
      if (typeof valor_mano_obra !== 'number' || isNaN(valor_mano_obra)) {
        return res.status(400).json({ error: 'El campo valor_mano_obra debe ser un número válido' });
      }
      if (valor_mano_obra < 0) {
        return res.status(400).json({ error: 'El valor de la mano de obra no puede ser negativo' });
      }

      // 5. Validar estado válido
      const validEstados = ['Recepcion', 'Diagnostico', 'Cotizacion', 'Reparacion', 'Entregado'];
      if (!validEstados.includes(estado)) {
        return res.status(400).json({ error: `Estado inválido. Debe ser uno de: ${validEstados.join(', ')}` });
      }

      // 6. Validar que la orden exista y su estado actual no sea Entregado
      const currentOrder = await ordenTrabajoRepository.findById(id);
      if (!currentOrder) {
        return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
      }
      if (currentOrder.estado === 'Entregado') {
        return res.status(400).json({ error: 'Si la orden tiene estado entregado ya no se puede actualizar' });
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

  async generarPdf(req, res) {
    try {
      const { id } = req.params;
      const order = await ordenTrabajoRepository.findById(id);
      if (!order) {
        return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
      }

      // Crear PDF con 50 pt de márgenes y tamaño A4
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      // Configurar encabezados de respuesta Express
      const placaStr = order.moto ? order.moto.placa : 'SIN_PLACA';
      let fechaStr = 'Pendiente';
      if (order.fecha_entrega) {
        const d = new Date(order.fecha_entrega);
        fechaStr = `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}_${d.getHours().toString().padStart(2,'0')}${d.getMinutes().toString().padStart(2,'0')}`;
      }
      const fileName = `${placaStr}_${fechaStr}_${order.id_orden_trabajo}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      doc.pipe(res);

      // Paleta de colores Premium
      const primaryColor = '#2C3E50'; // Azul oscuro / pizarra
      const secondaryColor = '#18BC9C'; // Turquesa / verde azulado
      const textColor = '#333333'; // Gris oscuro
      const lightBg = '#F8F9FA'; // Gris muy claro
      const borderLineColor = '#BDC3C7'; // Gris de borde

      // Título y Subtítulo de Cabecera (Izquierda)
      doc.fillColor(primaryColor)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('MOTORBIKE SERVICE CENTER', 50, 50);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#7F8C8D')
         .text('Calle 123 #45-67, Ciudad | Tel: 555-0199', 50, 75);

      // Información de Factura / Orden (Derecha)
      doc.fillColor(primaryColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text(`ORDEN DE TRABAJO #${order.id_orden_trabajo}`, 250, 50, { width: 295, align: 'right' });

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(textColor)
         .text(`Fecha Ingreso: ${new Date(order.fecha_ingreso).toLocaleString()}`, 250, 75, { width: 295, align: 'right' })
         .text(`Estado: ${order.estado.toUpperCase()}`, 250, 90, { width: 295, align: 'right' });

      if (order.fecha_entrega) {
        doc.text(`Fecha Entrega: ${new Date(order.fecha_entrega).toLocaleString()}`, 250, 105, { width: 295, align: 'right' });
      }

      // Separador horizontal coloreado
      doc.strokeColor(secondaryColor)
         .lineWidth(2)
         .moveTo(50, 130)
         .lineTo(545, 130)
         .stroke();

      // Cuadro de Información General
      const boxY = 145;
      const boxHeight = 100;
      doc.rect(50, boxY, 495, boxHeight)
         .fillAndStroke(lightBg, borderLineColor);

      // Texto de Información General
      doc.fillColor(primaryColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('INFORMACIÓN GENERAL', 65, boxY + 10);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(textColor)
         .text('Mecánico Asignado:', 65, boxY + 30)
         .font('Helvetica-Bold')
         .text(`${order.mecanico ? order.mecanico.nombre : 'No asignado'}`, 180, boxY + 30)
         
         .font('Helvetica')
         .text('Moto (Placa):', 65, boxY + 45)
         .font('Helvetica-Bold')
         .text(`${order.moto ? order.moto.placa : 'N/A'}`, 180, boxY + 45)

         .font('Helvetica')
         .text('Marca / Modelo:', 65, boxY + 60)
         .font('Helvetica-Bold')
         .text(`${order.moto ? `${order.moto.marca} - ${order.moto.modelo}` : 'N/A'}`, 180, boxY + 60)

         .font('Helvetica')
         .text('Color / Cilindraje:', 65, boxY + 75)
         .font('Helvetica-Bold')
         .text(`${order.moto ? `${order.moto.color} (${order.moto.cilindraje})` : 'N/A'}`, 180, boxY + 75);

      // Sección de Diagnóstico Técnico
      const diagY = boxY + boxHeight + 20;
      doc.fillColor(primaryColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('DIAGNÓSTICO TÉCNICO', 50, diagY);

      doc.strokeColor(borderLineColor)
         .lineWidth(1)
         .moveTo(50, diagY + 15)
         .lineTo(545, diagY + 15)
         .stroke();

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(textColor)
         .text(order.diagnostico, 50, diagY + 25, { width: 495, align: 'justify' });

      // Sección de Repuestos y Materiales
      doc.moveDown(2);
      const tableTitleY = doc.y + 10;
      doc.fillColor(primaryColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('REPUESTOS Y MATERIALES', 50, tableTitleY);

      doc.strokeColor(borderLineColor)
         .lineWidth(1)
         .moveTo(50, tableTitleY + 15)
         .lineTo(545, tableTitleY + 15)
         .stroke();

      // Encabezados de Tabla de Repuestos
      const tableHeaderY = tableTitleY + 25;
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('Repuesto', 60, tableHeaderY)
         .text('Cantidad', 280, tableHeaderY, { width: 60, align: 'center' })
         .text('Precio Unit.', 360, tableHeaderY, { width: 80, align: 'right' })
         .text('Subtotal', 460, tableHeaderY, { width: 80, align: 'right' });

      doc.strokeColor(primaryColor)
         .lineWidth(1)
         .moveTo(50, tableHeaderY + 15)
         .lineTo(545, tableHeaderY + 15)
         .stroke();

      // Filas de Repuestos
      let currentY = tableHeaderY + 20;
      const details = order.detalles || [];
      
      if (details.length === 0) {
        doc.fontSize(9)
           .font('Helvetica-Oblique')
           .fillColor(textColor)
           .text('No se agregaron repuestos a esta orden.', 60, currentY);
        currentY += 15;
      } else {
        doc.font('Helvetica').fontSize(9).fillColor(textColor);
        for (const detail of details) {
          const repNombre = detail.repuesto ? detail.repuesto.nombre : `ID Repuesto: ${detail.id_repuesto}`;
          const unitPrice = detail.cantidad > 0 ? (detail.subtotal / detail.cantidad) : 0;

          // Salto de página preventivo si sobrepasa el límite vertical
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          doc.text(repNombre, 60, currentY, { width: 210, ellipsis: true })
             .text(detail.cantidad.toString(), 280, currentY, { width: 60, align: 'center' })
             .text(`$${unitPrice.toLocaleString('es-CO')}`, 360, currentY, { width: 80, align: 'right' })
             .text(`$${detail.subtotal.toLocaleString('es-CO')}`, 460, currentY, { width: 80, align: 'right' });

          doc.strokeColor('#ECF0F1')
             .lineWidth(0.5)
             .moveTo(50, currentY + 13)
             .lineTo(545, currentY + 13)
             .stroke();

          currentY += 20;
        }
      }

      // Salto de página preventivo para el bloque de totales
      if (currentY > 650) {
        doc.addPage();
        currentY = 50;
      }

      // Bloque de Totales
      const sumY = currentY + 10;
      doc.strokeColor(primaryColor)
         .lineWidth(1.5)
         .moveTo(50, sumY)
         .lineTo(545, sumY)
         .stroke();

      const totalsX = 320;
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(textColor)
         .text('Mano de Obra:', totalsX, sumY + 10)
         .font('Helvetica-Bold')
         .text(`$${order.valor_mano_obra.toLocaleString('es-CO')}`, 460, sumY + 10, { width: 80, align: 'right' });

      const repuestosTotal = details.reduce((sum, d) => sum + d.subtotal, 0);

      doc.font('Helvetica')
         .text('Total Repuestos:', totalsX, sumY + 25)
         .font('Helvetica-Bold')
         .text(`$${repuestosTotal.toLocaleString('es-CO')}`, 460, sumY + 25, { width: 80, align: 'right' });

      // Distintivo Blanco sobre Azul para el Total General
      doc.rect(totalsX - 10, sumY + 42, 235, 30)
         .fill(primaryColor);

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#FFFFFF')
         .text('TOTAL GENERAL:', totalsX, sumY + 52)
         .text(`$${order.total.toLocaleString('es-CO')}`, 460, sumY + 52, { width: 80, align: 'right' });

      // Footer
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .fillColor('#95A5A6')
         .text('Gracias por confiar en Motorbike Service Center. Este documento constituye un comprobante técnico de servicio.', 50, 750, { width: 495, align: 'center' });

      // Terminar streaming
      doc.end();

    } catch (error) {
      res.status(500).json({ error: 'Error al generar el PDF: ' + error.message });
    }
  }
}

module.exports = new OrdenTrabajoController();
