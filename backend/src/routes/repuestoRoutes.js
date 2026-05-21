const express = require('express');
const router = express.Router();
const repuestoController = require('../controllers/repuestoController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Repuesto:
 *       type: object
 *       required:
 *         - referencia
 *         - nombre
 *         - stock
 *         - precio
 *       properties:
 *         id_repuesto:
 *           type: integer
 *           description: ID único del repuesto
 *         referencia:
 *           type: string
 *           description: Referencia única del repuesto (no puede ser vacía)
 *         nombre:
 *           type: string
 *           description: Nombre del repuesto (no puede ser vacío)
 *         stock:
 *           type: integer
 *           description: Cantidad en stock (no puede ser negativa)
 *         precio:
 *           type: number
 *           format: double
 *           description: Precio unitario del repuesto (no puede ser negativo)
 *         responsible_user:
 *           type: integer
 *           description: ID del usuario responsable
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         id_repuesto: 1
 *         referencia: REF-100234
 *         nombre: Filtro de Aceite Honda
 *         stock: 50
 *         precio: 15.5
 *         responsible_user: 2
 *         created_at: "2026-05-21T03:00:00.000Z"
 *         updated_at: "2026-05-21T03:00:00.000Z"
 *     RepuestoResponseBasic:
 *       type: object
 *       properties:
 *         id_repuesto:
 *           type: integer
 *           description: ID único del repuesto
 *         referencia:
 *           type: string
 *           description: Referencia del repuesto
 *         nombre:
 *           type: string
 *           description: Nombre del repuesto
 *         stock:
 *           type: integer
 *           description: Stock del repuesto
 *         precio:
 *           type: number
 *           format: double
 *           description: Precio del repuesto
 *       example:
 *         id_repuesto: 1
 *         referencia: REF-100234
 *         nombre: Filtro de Aceite Honda
 *         stock: 50
 *         precio: 15.5
 */

/**
 * @swagger
 * /api/repuestos:
 *   get:
 *     summary: Obtiene la lista de repuestos paginada
 *     tags: [Repuestos]
 *     parameters:
 *       - in: query
 *         name: referencia
 *         schema:
 *           type: string
 *         description: Filtrar por referencia del repuesto (búsqueda parcial)
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Filtrar por nombre del repuesto (búsqueda parcial)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página (o usar 'pagina')
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad máxima por página (o usar 'limite')
 *     responses:
 *       200:
 *         description: Lista paginada de repuestos
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
 *                     $ref: '#/components/schemas/RepuestoResponseBasic'
 *       401:
 *         description: No autorizado (Token no proporcionado o expirado)
 *       403:
 *         description: Usuario desactivado
 */
router.get('/', authMiddleware, repuestoController.getAll);

/**
 * @swagger
 * /api/repuestos/{id}:
 *   get:
 *     summary: Obtiene un repuesto por su ID
 *     tags: [Repuestos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del repuesto
 *     responses:
 *       200:
 *         description: Repuesto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepuestoResponseBasic'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Usuario desactivado
 *       404:
 *         description: Repuesto no encontrado
 */
router.get('/:id', authMiddleware, repuestoController.getById);

/**
 * @swagger
 * /api/repuestos:
 *   post:
 *     summary: Crea un nuevo repuesto (Admin y Empleado únicamente)
 *     tags: [Repuestos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referencia
 *               - nombre
 *               - stock
 *               - precio
 *             properties:
 *               referencia:
 *                 type: string
 *               nombre:
 *                 type: string
 *               stock:
 *                 type: integer
 *               precio:
 *                 type: number
 *                 format: double
 *             example:
 *               referencia: REF-100234
 *               nombre: Filtro de Aceite Honda
 *               stock: 50
 *               precio: 15.5
 *     responses:
 *       201:
 *         description: Repuesto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 repuesto:
 *                   $ref: '#/components/schemas/Repuesto'
 *       400:
 *         description: Datos inválidos o faltantes (campos en blanco, valores negativos)
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permiso (requiere rol de admin o empleado)
 *       409:
 *         description: Conflicto, la referencia ya existe
 */
router.post('/', authMiddleware, requireRole(['admin', 'empleado']), repuestoController.create);

/**
 * @swagger
 * /api/repuestos/{id}:
 *   put:
 *     summary: Actualiza un repuesto existente (Admin y Empleado únicamente)
 *     tags: [Repuestos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del repuesto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referencia
 *               - nombre
 *               - stock
 *               - precio
 *             properties:
 *               referencia:
 *                 type: string
 *               nombre:
 *                 type: string
 *               stock:
 *                 type: integer
 *               precio:
 *                 type: number
 *                 format: double
 *             example:
 *               referencia: REF-100234
 *               nombre: Filtro de Aceite Honda modificado
 *               stock: 45
 *               precio: 16.0
 *     responses:
 *       200:
 *         description: Repuesto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 repuesto:
 *                   $ref: '#/components/schemas/Repuesto'
 *       400:
 *         description: Datos inválidos (campos vacíos, valores negativos o incompletos)
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permiso
 *       404:
 *         description: Repuesto no encontrado
 *       409:
 *         description: Conflicto, la nueva referencia ya está en uso por otro repuesto
 */
router.put('/:id', authMiddleware, requireRole(['admin', 'empleado']), repuestoController.update);

/**
 * @swagger
 * /api/repuestos/{id}:
 *   delete:
 *     summary: Elimina un repuesto (Admin y Empleado únicamente)
 *     tags: [Repuestos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del repuesto a eliminar
 *     responses:
 *       200:
 *         description: Repuesto eliminado exitosamente
 *       400:
 *         description: El repuesto no puede ser eliminado porque está relacionado con otras entidades
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permiso
 *       404:
 *         description: Repuesto no encontrado
 */
router.delete('/:id', authMiddleware, requireRole(['admin', 'empleado']), repuestoController.delete);

module.exports = router;
