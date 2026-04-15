import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

export const getProfile = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const result = await pool.query(
      'SELECT id, name, email, phone, created_at FROM users WHERE email = $1',
      [userEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const { name, phone } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'El nombre es requerido',
        code: 'MISSING_FIELDS'
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET name = $1, phone = $2, updated_at = NOW()
       WHERE email = $3
       RETURNING id, name, email, phone, created_at`,
      [name.trim(), phone || null, userEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos',
        code: 'MISSING_FIELDS'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'Las nuevas contraseñas no coinciden',
        code: 'PASSWORD_MISMATCH'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 6 caracteres',
        code: 'WEAK_PASSWORD'
      });
    }

    // Get user and verify current password
    const userResult = await pool.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [userEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'NOT_FOUND'
      });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Contraseña actual incorrecta',
        code: 'INVALID_PASSWORD'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, user.id]
    );

    res.status(200).json({
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    next(error);
  }
};
