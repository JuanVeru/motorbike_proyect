const userRepository = require('../repositories/userRepository');
const { User } = require('../models');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

const validatePassword = (password) => {
  if (password.length < 8) {
    return { valid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'La contraseña debe tener al menos una mayúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'La contraseña debe tener al menos un número' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'La contraseña debe tener al menos un carácter especial' };
  }
  return { valid: true };
};

class UserController {
  async getAll(req, res) {
    const { is_active, rol } = req.query;
    const isActive = is_active !== undefined ? is_active === 'true' : null;
    const { limit, offset, page } = getPaginationParams(req.query);

    const { rows, count } = await userRepository.findAll(isActive, rol, limit, offset);

    const paginatedResponse = buildPaginatedResponse(rows, count, page, limit);
    res.json(paginatedResponse);
  }

  async getById(req, res) {
    const user = await userRepository.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  }

  async create(req, res) {
    const { nombre, correo, cedula, telefono, password, rol } = req.body;
    const requestingUser = req.user;

    // Validar presencia de todos los campos obligatorios
    if (!nombre || !correo || !cedula || !telefono || !password || !rol) {
      return res.status(400).json({ error: 'nombre, correo, cedula, telefono, password y rol son obligatorios' });
    }

    // Validar que los campos de texto no estén vacíos o en blanco
    if (typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ error: 'El campo nombre no puede estar vacío' });
    }
    if (typeof correo !== 'string' || correo.trim() === '') {
      return res.status(400).json({ error: 'El campo correo no puede estar vacío' });
    }
    if (typeof cedula !== 'string' || cedula.trim() === '') {
      return res.status(400).json({ error: 'El campo cedula no puede estar vacío' });
    }
    if (typeof telefono !== 'string' || telefono.trim() === '') {
      return res.status(400).json({ error: 'El campo telefono no puede estar vacío' });
    }
    if (typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({ error: 'El campo password no puede estar vacío' });
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Control de acceso basado en rol del usuario que crea
    if (requestingUser.rol === 'empleado') {
      // Empleado solo puede crear clientes
      if (rol !== 'cliente') {
        return res.status(403).json({ error: 'Un empleado solo puede crear usuarios con rol cliente' });
      }
    } else if (requestingUser.rol === 'admin') {
      // Admin puede crear empleados o clientes (no admins)
      if (!['empleado', 'cliente'].includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido. Solo se permite: empleado, cliente' });
      }
    }

    // Validar unicidad de correo
    const existingByEmail = await userRepository.findByEmail(correo.trim());
    if (existingByEmail) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Validar unicidad de cédula
    const existingByCedula = await userRepository.findByCedula(cedula.trim());
    if (existingByCedula) {
      return res.status(409).json({ error: 'La cédula ya está registrada' });
    }

    await userRepository.create({
      nombre: nombre.trim(),
      correo: correo.trim(),
      cedula: cedula.trim(),
      telefono: telefono.trim(),
      password,
      rol,
      is_active: true
    });

    res.status(201).json({ message: 'Usuario creado exitosamente' });
  }

  async update(req, res) {
    const { nombre, correo, cedula, telefono, password } = req.body;
    const { id } = req.params;
    const requestingUser = req.user;

    // Validar presencia de campos obligatorios
    if (!nombre || !correo || !cedula || !telefono) {
      return res.status(400).json({ error: 'nombre, correo, cedula y telefono son obligatorios' });
    }

    // Validar que los campos de texto no estén vacíos o en blanco
    if (typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ error: 'El campo nombre no puede estar vacío' });
    }
    if (typeof correo !== 'string' || correo.trim() === '') {
      return res.status(400).json({ error: 'El campo correo no puede estar vacío' });
    }
    if (typeof cedula !== 'string' || cedula.trim() === '') {
      return res.status(400).json({ error: 'El campo cedula no puede estar vacío' });
    }
    if (typeof telefono !== 'string' || telefono.trim() === '') {
      return res.status(400).json({ error: 'El campo telefono no puede estar vacío' });
    }

    // Validar si existe el usuario
    const user = await userRepository.findById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Control de acceso basado en el rol del solicitante
    if (requestingUser.rol === 'empleado' && user.rol !== 'cliente') {
      return res.status(403).json({ error: 'Un empleado solo puede actualizar usuarios con rol cliente' });
    }

    // Validar unicidad de correo (excluyendo el usuario actual)
    const existingByEmail = await userRepository.findByEmail(correo.trim());
    if (existingByEmail && existingByEmail.id !== parseInt(id)) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Validar unicidad de cédula (excluyendo el usuario actual)
    const existingByCedula = await userRepository.findByCedula(cedula.trim());
    if (existingByCedula && existingByCedula.id !== parseInt(id)) {
      return res.status(409).json({ error: 'La cédula ya está registrada' });
    }

    await userRepository.update(id, {
      nombre: nombre.trim(),
      correo: correo.trim(),
      cedula: cedula.trim(),
      telefono: telefono.trim(),
      password
    });
    res.json({ message: 'Usuario actualizado exitosamente' });
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const user = await userRepository.findById(id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      // Programmatic check of associations
      const associations = Object.values(User.associations);
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
              error: `No se puede eliminar el usuario porque está relacionado con la entidad ${association.target.name}`
            });
          }
        }
      }

      // DB-level check fallback
      try {
        await userRepository.delete(id);
        res.json({ message: 'Usuario eliminado exitosamente' });
      } catch (dbError) {
        if (dbError.name === 'SequelizeForeignKeyConstraintError') {
          return res.status(400).json({
            error: 'No se puede eliminar el usuario porque está relacionado con otras entidades'
          });
        }
        throw dbError;
      }
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el usuario: ' + error.message });
    }
  }

  async toggleActive(req, res) {
    const { id } = req.params;

    const user = await userRepository.findById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.rol === 'admin') {
      return res.status(403).json({ error: 'No se puede activar/desactivar usuarios con rol admin' });
    }

    await userRepository.update(id, {
      nombre: user.nombre,
      correo: user.correo,
      cedula: user.cedula,
      telefono: user.telefono,
      is_active: !user.is_active
    });
    res.json({ message: `Usuario ${user.is_active ? 'desactivado' : 'activado'} exitosamente` });
  }

  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword y newPassword son obligatorios' });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    const user = await userRepository.findByEmailWithPassword(req.user.correo);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isPasswordValid = await userRepository.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const isSamePassword = await userRepository.comparePassword(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la actual' });
    }

    await userRepository.update(userId, {
      nombre: user.nombre,
      correo: user.correo,
      cedula: user.cedula,
      telefono: user.telefono,
      password: newPassword
    });
    res.json({ message: 'Contraseña actualizada exitosamente' });
  }

  async adminResetPassword(req, res) {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'newPassword es obligatorio' });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    const user = await userRepository.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.rol === 'admin') {
      return res.status(403).json({ error: 'No se puede cambiar la contraseña de usuarios admin' });
    }

    await userRepository.update(id, {
      nombre: user.nombre,
      correo: user.correo,
      cedula: user.cedula,
      telefono: user.telefono,
      password: newPassword
    });
    res.json({ message: 'Contraseña reseteada exitosamente' });
  }
}

module.exports = new UserController();