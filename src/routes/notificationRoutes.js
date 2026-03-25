import express from "express";
import { body, param } from "express-validator";
import {
  createNotification,
  deleteNotification,
  getNotificationById,
  getNotificationByUser,
  getNotifications,
  getUnreadNotificationsByUser,
  markAllAsReadByUser,
  markAsRead,
  updateNotification,
} from "../controllers/notificationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  bodyMongoIdValidation,
  messageValidation,
  booleanValidation,
  mongoIdValidation,
} from "../middlewares/validators.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Endpoints for user notifications
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Obtiene todas las notificaciones (admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
// Obtener todas las notificaciones (admin)
router.get("/notifications", authMiddleware, isAdmin, getNotifications);

/**
 * @swagger
 * /notifications/unread/{userId}:
 *   get:
 *     summary: Obtiene notificaciones no leídas de un usuario
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notificaciones no leídas
 */
// Obtener notificaciones no leídas por usuario
router.get(
  "/notifications/unread/:userId",
  authMiddleware,
  [mongoIdValidation("userId", "User ID")],
  validate,
  getUnreadNotificationsByUser
);

/**
 * @swagger
 * /notifications/user/{userId}:
 *   get:
 *     summary: Obtiene todas las notificaciones de un usuario
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de notificaciones del usuario
 */
// Obtener notificaciones por usuario
router.get(
  "/notifications/user/:userId",
  authMiddleware,
  [mongoIdValidation("userId", "User ID")],
  validate,
  getNotificationByUser
);

/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     summary: Obtiene una notificación por ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la notificación
 */
// Obtener notificación por ID
router.get(
  "/notifications/:id",
  authMiddleware,
  [mongoIdValidation("id", "Notification ID")],
  validate,
  getNotificationById
);

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Crea una nueva notificación
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - message
 *             properties:
 *               user:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notificación creada exitosamente
 */
// Crear nueva notificación
router.post(
  "/notifications",
  authMiddleware,
  [bodyMongoIdValidation("user", "User"), messageValidation()],
  validate,
  createNotification
);

/**
 * @swagger
 * /notifications/{id}/mark-read:
 *   patch:
 *     summary: Marca una notificación como leída
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 */
// Marcar una notificación como leída
router.patch(
  "/notifications/:id/mark-read",
  authMiddleware,
  [mongoIdValidation("id", "Notification ID")],
  validate,
  markAsRead
);

/**
 * @swagger
 * /notifications/user/{userId}/mark-all-read:
 *   patch:
 *     summary: Marca todas las notificaciones de un usuario como leídas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notificaciones marcadas exitosamente
 */
// Marcar todas las notificaciones de un usuario como leídas
router.patch(
  "/notifications/user/:userId/mark-all-read",
  authMiddleware,
  [mongoIdValidation("userId", "User ID")],
  validate,
  markAllAsReadByUser
);

/**
 * @swagger
 * /notifications/{id}:
 *   put:
 *     summary: Actualiza una notificación (admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               isRead:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notificación actualizada
 */
// Actualizar notificación
router.put(
  "/notifications/:id",
  authMiddleware,
  isAdmin,
  [
    mongoIdValidation("id", "Notification ID"),
    messageValidation(500).optional(),
    booleanValidation("isRead"),
  ],
  validate,
  updateNotification
);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Elimina una notificación
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notificación eliminada
 */
// Eliminar notificación
router.delete(
  "/notifications/:id",
  authMiddleware,
  [mongoIdValidation("id", "Notification ID")],
  validate,
  deleteNotification
);

export default router;
