import pool from '../config/database.js';

export const getCategories = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, color, icon FROM categories ORDER BY name ASC'
    );

    res.status(200).json({
      categories: result.rows
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    next(error);
  }
};
