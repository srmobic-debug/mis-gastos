import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getMessages, reprocessMessage } from '../controllers/messages.controller.js';

const router = express.Router();

// Proteger todas las rutas con autenticación
router.use(authenticate);

// GET /api/messages - Obtener todos los mensajes del usuario
router.get('/', getMessages);

// POST /api/messages/:id/reprocess - Reprocesar un mensaje
router.post('/:id/reprocess', reprocessMessage);

export default router;
