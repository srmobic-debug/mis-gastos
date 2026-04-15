import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile, updateProfile, changePassword } from '../controllers/users.controller.js';

const router = express.Router();

// Proteger todas las rutas con autenticación
router.use(authenticate);

// GET /api/v1/users/profile - Obtener perfil del usuario
router.get('/profile', getProfile);

// PUT /api/v1/users/profile - Actualizar perfil del usuario
router.put('/profile', updateProfile);

// POST /api/v1/users/change-password - Cambiar contraseña
router.post('/change-password', changePassword);

export default router;
