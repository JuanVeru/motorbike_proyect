const repuestoRepository = require('../repositories/repuestoRepository');
const { Repuesto } = require('../models');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

class RepuestoController {
  async getAll(req, res) {
    try {
      const { referencia, nombre } = req.query;
      const { limit, offset, page } = getPaginationParams(req.query);

      const { rows, count } = await repuestoRepository.findAll({
        referencia,
        nombre,
        limit,
        offset
      });

      const filteredRows = rows.map(r => ({
        id_repuesto: r.id_repuesto,
        referencia: r.referencia,
        nombre: r.nombre,
        stock: r.stock,
        precio: r.precio
      }));

      const paginatedResponse = buildPaginatedResponse(filteredRows, count, page, limit);
      res.json(paginatedResponse);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los repuestos: ' + error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const repuesto = await repuestoRepository.findById(id);
      if (!repuesto) {
        return res.status(404).json({ error: 'Repuesto no encontrado' });
      }

      const filtered = {
        id_repuesto: repuesto.id_repuesto,
        referencia: repuesto.referencia,
        nombre: repuesto.nombre,
        stock: repuesto.stock,
        precio: repuesto.precio
      };

      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el repuesto: ' + error.message });
    }
  }

  async create(req, res) {
    try {
      const { referencia, nombre, stock, precio } = req.body;
      const responsible_user = req.user.id;

      // 1. Validar presencia
      if (
        referencia === undefined || referencia === null ||
        nombre === undefined || nombre === null ||
        stock === undefined || stock === null ||
        precio === undefined || precio === null
      ) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios: referencia, nombre, stock, precio' });
      }

      // 2. Validar que no sean blancos o vacíos
      if (typeof referencia !== 'string' || referencia.trim() === '') {
        return res.status(400).json({ error: 'El campo referencia no puede estar vacío' });
      }
      if (typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({ error: 'El campo nombre no puede estar vacío' });
      }

      // 3. Validar stock
      if (typeof stock !== 'number' || !Number.isInteger(stock)) {
        return res.status(400).json({ error: 'El campo stock debe ser un número entero' });
      }
      if (stock < 0) {
        return res.status(400).json({ error: 'El stock no puede ser negativo' });
      }

      // 4. Validar precio
      if (typeof precio !== 'number' || isNaN(precio)) {
        return res.status(400).json({ error: 'El campo precio debe ser un número válido' });
      }
      if (precio < 0) {
        return res.status(400).json({ error: 'El precio no puede ser negativo' });
      }

      // 5. Validar unicidad de referencia
      const existingRepuesto = await repuestoRepository.findByReferencia(referencia.trim());
      if (existingRepuesto) {
        return res.status(409).json({ error: 'La referencia ya está registrada' });
      }

      const repuesto = await repuestoRepository.create({
        referencia: referencia.trim(),
        nombre: nombre.trim(),
        stock,
        precio,
        responsible_user
      });

      res.status(201).json({ message: 'Repuesto creado exitosamente', repuesto });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear el repuesto: ' + error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { referencia, nombre, stock, precio } = req.body;
      const responsible_user = req.user.id;

      // 1. Validar presencia
      if (
        referencia === undefined || referencia === null ||
        nombre === undefined || nombre === null ||
        stock === undefined || stock === null ||
        precio === undefined || precio === null
      ) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios: referencia, nombre, stock, precio' });
      }

      // 2. Validar que no sean blancos o vacíos
      if (typeof referencia !== 'string' || referencia.trim() === '') {
        return res.status(400).json({ error: 'El campo referencia no puede estar vacío' });
      }
      if (typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({ error: 'El campo nombre no puede estar vacío' });
      }

      // 3. Validar stock
      if (typeof stock !== 'number' || !Number.isInteger(stock)) {
        return res.status(400).json({ error: 'El campo stock debe ser un número entero' });
      }
      if (stock < 0) {
        return res.status(400).json({ error: 'El stock no puede ser negativo' });
      }

      // 4. Validar precio
      if (typeof precio !== 'number' || isNaN(precio)) {
        return res.status(400).json({ error: 'El campo precio debe ser un número válido' });
      }
      if (precio < 0) {
        return res.status(400).json({ error: 'El precio no puede ser negativo' });
      }

      // Validar si existe el repuesto
      const repuesto = await repuestoRepository.findById(id);
      if (!repuesto) {
        return res.status(404).json({ error: 'Repuesto no encontrado' });
      }

      // 5. Validar unicidad de referencia (excluyendo el repuesto actual)
      const existingRepuesto = await repuestoRepository.findByReferencia(referencia.trim());
      if (existingRepuesto && existingRepuesto.id_repuesto !== parseInt(id, 10)) {
        return res.status(409).json({ error: 'La referencia ya está registrada' });
      }

      const updated = await repuestoRepository.update(id, {
        referencia: referencia.trim(),
        nombre: nombre.trim(),
        stock,
        precio,
        responsible_user
      });

      res.json({ message: 'Repuesto actualizado exitosamente', repuesto: updated });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el repuesto: ' + error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const repuesto = await repuestoRepository.findById(id);
      if (!repuesto) {
        return res.status(404).json({ error: 'Repuesto no encontrado' });
      }

      // Programmatic check of associations
      const associations = Object.values(Repuesto.associations);
      for (const association of associations) {
        if (
          association.associationType === 'HasOne' ||
          association.associationType === 'HasMany' ||
          association.associationType === 'BelongsToMany'
        ) {
          const count = await association.target.count({
            where: { [association.foreignKey]: id }
          });
          if (count > 0) {
            return res.status(400).json({
              error: `No se puede eliminar el repuesto porque está relacionado con la entidad ${association.target.name}`
            });
          }
        }
      }

      // DB-level check fallback
      try {
        await repuestoRepository.delete(id);
        res.json({ message: 'Repuesto eliminado exitosamente' });
      } catch (dbError) {
        if (dbError.name === 'SequelizeForeignKeyConstraintError') {
          return res.status(400).json({
            error: 'No se puede eliminar el repuesto porque está relacionado con otras entidades'
          });
        }
        throw dbError;
      }
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el repuesto: ' + error.message });
    }
  }
}

module.exports = new RepuestoController();
