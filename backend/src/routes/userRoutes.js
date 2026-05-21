const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del usuario
 *         nombre:
 *           type: string
 *           description: Nombre completo del usuario
 *         correo:
 *           type: string
 *           description: Correo electrónico único
 *         cedula:
 *           type: string
 *           description: Número de cédula único del usuario
 *         telefono:
 *           type: string
 *           description: Número de teléfono del usuario
 *         rol:
 *           type: string
 *           description: Rol del usuario (admin, empleado, cliente)
 *         is_active:
 *           type: boolean
 *           description: Estado del usuario
 *       example:
 *         id: 1
 *         nombre: Juan Pérez
 *         correo: juan@example.com
 *         cedula: "123456789"
 *         telefono: "3001234567"
 *         rol: cliente
 *         is_active: true
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtiene todos los usuarios (paginado)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo (true/false)
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [admin, empleado, cliente]
 *         description: Filtrar por rol
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad máxima de objetos por página
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios (incluye cedula y telefono)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 retrievedCount:
 *                   type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 */
router.get('/', authMiddleware, (req, res) => userController.getAll(req, res));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtiene un usuario por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado (incluye cedula y telefono)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', authMiddleware, (req, res) => userController.getById(req, res));

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crea un nuevo usuario (Admin y Empleado)
 *     description: |
 *       - **Admin**: puede crear usuarios con rol `empleado` o `cliente`.
 *       - **Empleado**: solo puede crear usuarios con rol `cliente`.
 *       - Todos los campos son obligatorios y no pueden estar vacíos.
 *       - `cedula` debe ser única en el sistema.
 *       - `correo` debe ser único en el sistema.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - cedula
 *               - telefono
 *               - password
 *               - rol
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               cedula:
 *                 type: string
 *               telefono:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: "Mínimo 8 caracteres, una mayúscula, un número, un carácter especial"
 *               rol:
 *                 type: string
 *                 enum: [empleado, cliente]
 *             example:
 *               nombre: Juan Pérez
 *               correo: juan@example.com
 *               cedula: "123456789"
 *               telefono: "3001234567"
 *               password: "Password1!"
 *               rol: cliente
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos inválidos, campos vacíos o rol no permitido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permiso (empleado intentando crear un empleado/admin)
 *       409:
 *         description: Correo o cédula ya registrada
 */
router.post('/', authMiddleware, requireRole(['admin', 'empleado']), (req, res) => userController.create(req, res));

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualiza un usuario (Admin y Empleado)
 *     description: |
 *       - **Admin**: puede actualizar cualquier usuario.
 *       - **Empleado**: solo puede actualizar usuarios con rol `cliente`.
 *       - **Cliente**: no tiene acceso a este endpoint.
 *       - Todos los campos son obligatorios y no pueden estar vacíos ni en blanco.
 *       - `cedula` y `correo` deben ser únicos (excluyendo el usuario actual).
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - cedula
 *               - telefono
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               cedula:
 *                 type: string
 *               telefono:
 *                 type: string
 *             example:
 *               nombre: Juan Pérez
 *               correo: juan@example.com
 *               cedula: "123456789"
 *               telefono: "3001234567"
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       400:
 *         description: Datos inválidos o campos vacíos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permiso (empleado intentando actualizar un empleado o admin)
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: Correo o cédula ya registrada
 */
router.put('/:id', authMiddleware, requireRole(['admin', 'empleado']), (req, res) => userController.update(req, res));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Elimina un usuario (solo Admin)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:id', authMiddleware, requireRole(['admin']), (req, res) => userController.delete(req, res));

/**
 * @swagger
 * /api/users/{id}/toggle-active:
 *   patch:
 *     summary: Activa o desactiva un usuario (solo Admin)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Estado del usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No se puede activar/desactivar usuarios admin
 *       404:
 *         description: Usuario no encontrado
 */
router.patch('/:id/toggle-active', authMiddleware, requireRole(['admin']), (req, res) => userController.toggleActive(req, res));

/**
 * @swagger
 * /api/users/change-password:
 *   patch:
 *     summary: Cambia la contraseña del usuario autenticado
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Contraseña actual
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña (mínimo 8 caracteres, una mayúscula, un número, un carácter especial)
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Datos inválidos o contraseña no cumple requisitos
 *       401:
 *         description: Contraseña actual incorrecta
 *       404:
 *         description: Usuario no encontrado
 */
router.patch('/change-password', authMiddleware, (req, res) => userController.changePassword(req, res));

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   patch:
 *     summary: Resetea la contraseña de un usuario (solo Admin)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña (mínimo 8 caracteres, una mayúscula, un número, un carácter especial)
 *     responses:
 *       200:
 *         description: Contraseña reseteada exitosamente
 *       400:
 *         description: Datos inválidos o contraseña no cumple requisitos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No se puede cambiar la contraseña de usuarios admin
 *       404:
 *         description: Usuario no encontrado
 */
router.patch('/:id/reset-password', authMiddleware, requireRole(['admin']), (req, res) => userController.adminResetPassword(req, res));

module.exports = router;