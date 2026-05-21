const express = require('express');
const router = express.Router();
const ordenTrabajoController = require('../controllers/ordenTrabajoController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     DetalleOrden:
 *       type: object
 *       required:
 *         - id_repuesto
 *         - cantidad
 *       properties:
 *         id_detallerOrden:
 *           type: integer
 *           description: ID único de detalle de orden
 *         id_orden:
 *           type: integer
 *           description: ID de la orden de trabajo asociada
 *         id_repuesto:
 *           type: integer
 *           description: ID del repuesto asignado
 *         nombre_repuesto:
 *           type: string
 *           description: Nombre del repuesto
 *         nombre_Respuesto:
 *           type: string
 *           description: Nombre del repuesto (llave alternativa con mayúscula)
 *         cantidad:
 *           type: integer
 *           description: Cantidad del repuesto solicitado
 *         subtotal:
 *           type: number
 *           format: double
 *           description: Subtotal autocalculado (cantidad * precio_repuesto)
 *       example:
 *         id_detallerOrden: 1
 *         id_orden: 10
 *         id_repuesto: 2
 *         nombre_repuesto: "Filtro de Aceite"
 *         nombre_Respuesto: "Filtro de Aceite"
 *         cantidad: 2
 *         subtotal: 70000.0
 *
 *     OrdenTrabajo:
 *       type: object
 *       required:
 *         - id_moto
 *         - id_mecanico
 *         - fecha_ingreso
 *         - diagnostico
 *         - valor_mano_obra
 *       properties:
 *         id_orden_trabajo:
 *           type: integer
 *           description: ID único autogenerado de la orden de trabajo
 *         id_moto:
 *           type: integer
 *           description: ID de la moto asociada
 *         placa_moto:
 *           type: string
 *           description: Placa de la moto asociada (cargada dinámicamente)
 *         id_mecanico:
 *           type: integer
 *           description: ID del usuario (mecánico) asignado
 *         nombre_mecanico:
 *           type: string
 *           description: Nombre completo del mecánico asignado (cargado dinámicamente)
 *         fecha_ingreso:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de ingreso al taller
 *         fecha_entrega:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha y hora de entrega al cliente
 *         diagnostico:
 *           type: string
 *           description: Descripción técnica o diagnóstico inicial de la moto
 *         estado:
 *           type: string
 *           enum: [Recepcion, Diagnostico, Cotizacion, Reparacion, Entregado]
 *           description: Estado actual de la orden de trabajo
 *         valor_mano_obra:
 *           type: number
 *           format: double
 *           description: Valor monetario asignado a la mano de obra
 *         total:
 *           type: number
 *           format: double
 *           description: Total calculado de la orden (mano de obra + subtotales de repuestos)
 *         id_responsible_user:
 *           type: integer
 *           description: ID del usuario del backend que registró o administra la orden
 *         detalleOrden:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DetalleOrden'
 *           description: Listado de repuestos agregados a la orden
 *       example:
 *         id_orden_trabajo: 10
 *         id_moto: 1
 *         placa_moto: "XYZ987"
 *         id_mecanico: 3
 *         nombre_mecanico: "Juan Pérez"
 *         fecha_ingreso: "2026-05-21T08:00:00.000Z"
 *         fecha_entrega: null
 *         diagnostico: "Cambio de aceite y mantenimiento de kit de arrastre"
 *         estado: "Recepcion"
 *         valor_mano_obra: 50000.0
 *         total: 120000.0
 *         id_responsible_user: 2
 *         detalleOrden:
 *           - id_detallerOrden: 1
 *           - id_orden: 10
 *           - id_repuesto: 2
 *             nombre_repuesto: "Filtro de Aceite"
 *             nombre_Respuesto: "Filtro de Aceite"
 *             cantidad: 2
 *             subtotal: 70000.0
 */

/**
 * @swagger
 * /api/ordenes:
 *   get:
 *     summary: Listar órdenes de trabajo
 *     tags: [Órdenes de Trabajo]
 *     parameters:
 *       - in: query
 *         name: id_moto
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de la moto
 *       - in: query
 *         name: id_mecanico
 *         schema:
 *           type: integer
 *         description: Filtrar por ID del mecánico
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Recepcion, Diagnostico, Cotizacion, Reparacion, Entregado]
 *         description: Filtrar por estado de la orden
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página (paginación)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Cantidad de registros por página
 *     responses:
 *       200:
 *         description: Lista paginada de órdenes de trabajo
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
 *                     type: object
 *                     properties:
 *                       id_orden_trabajo:
 *                         type: integer
 *                       id_moto:
 *                         type: integer
 *                       placa_moto:
 *                         type: string
 *                       id_mecanico:
 *                         type: integer
 *                       nombre_mecanico:
 *                         type: string
 *                       fecha_ingreso:
 *                         type: string
 *                       fecha_entrega:
 *                         type: string
 *                       estado:
 *                         type: string
 *                       total:
 *                         type: number
 */
router.get('/', authMiddleware, (req, res) => ordenTrabajoController.getAll(req, res));

/**
 * @swagger
 * /api/ordenes/{id}:
 *   get:
 *     summary: Obtener una orden de trabajo individual por ID
 *     tags: [Órdenes de Trabajo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de trabajo
 *     responses:
 *       200:
 *         description: Orden de trabajo encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrdenTrabajo'
 *       404:
 *         description: Orden de trabajo no encontrada
 */
router.get('/:id', authMiddleware, (req, res) => ordenTrabajoController.getById(req, res));

/**
 * @swagger
 * /api/ordenes:
 *   post:
 *     summary: Crear una nueva orden de trabajo (Admin y Empleado)
 *     tags: [Órdenes de Trabajo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_moto
 *               - id_mecanico
 *               - fecha_ingreso
 *               - diagnostico
 *               - valor_mano_obra
 *             properties:
 *               id_moto:
 *                 type: integer
 *               id_mecanico:
 *                 type: integer
 *                 description: ID del mecánico (debe ser rol empleado y estar activo)
 *               fecha_ingreso:
 *                 type: string
 *                 format: date-time
 *               diagnostico:
 *                 type: string
 *               valor_mano_obra:
 *                 type: number
 *                 minimum: 0
 *               detalleOrden:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id_repuesto
 *                     - cantidad
 *                   properties:
 *                     id_repuesto:
 *                       type: integer
 *                     cantidad:
 *                       type: integer
 *                       minimum: 0
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 orden:
 *                   $ref: '#/components/schemas/OrdenTrabajo'
 *       400:
 *         description: Error de validación o stock insuficiente
 *       404:
 *         description: Moto, mecánico o repuesto no encontrado
 */
router.post('/', authMiddleware, requireRole(['admin', 'empleado']), (req, res) => ordenTrabajoController.create(req, res));

/**
 * @swagger
 * /api/ordenes/{id}:
 *   put:
 *     summary: Actualizar una orden de trabajo (Admin y Empleado)
 *     tags: [Órdenes de Trabajo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de trabajo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_moto
 *               - id_mecanico
 *               - fecha_ingreso
 *               - diagnostico
 *               - estado
 *               - valor_mano_obra
 *             properties:
 *               id_moto:
 *                 type: integer
 *               id_mecanico:
 *                 type: integer
 *               fecha_ingreso:
 *                 type: string
 *                 format: date-time
 *               diagnostico:
 *                 type: string
 *               estado:
 *                 type: string
 *                 enum: [Recepcion, Diagnostico, Cotizacion, Reparacion, Entregado]
 *               valor_mano_obra:
 *                 type: number
 *                 minimum: 0
 *               detalleOrden:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id_repuesto
 *                     - cantidad
 *                   properties:
 *                     id_repuesto:
 *                       type: integer
 *                     cantidad:
 *                       type: integer
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: Orden de trabajo actualizada exitosamente
 *       400:
 *         description: Intento de actualizar orden 'Entregado' o error de validación
 *       404:
 *         description: Orden, moto, mecánico o repuesto no encontrado
 */
router.put('/:id', authMiddleware, requireRole(['admin', 'empleado']), (req, res) => ordenTrabajoController.update(req, res));

/**
 * @swagger
 * /api/ordenes/{id}:
 *   delete:
 *     summary: Eliminar una orden de trabajo (Solo Admin)
 *     tags: [Órdenes de Trabajo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden de trabajo
 *     responses:
 *       200:
 *         description: Orden de trabajo eliminada y stock devuelto exitosamente
 *       404:
 *         description: Orden no encontrada
 */
router.delete('/:id', authMiddleware, requireRole(['admin']), (req, res) => ordenTrabajoController.delete(req, res));

module.exports = router;
