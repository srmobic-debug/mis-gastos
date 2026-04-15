import pool from '../config/database.js';

export const getExpenses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fecha_desde, fecha_hasta, category_id, status, search, limit = '1000', offset = '0' } = req.query;

    let query = `SELECT
      e.id,
      e.description,
      e.amount,
      e.expense_date,
      e.category_id,
      e.status,
      e.capture_channel,
      c.name as category_name,
      c.color,
      c.icon
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = $1`;

    const params = [userId];
    let paramCount = 2;

    if (fecha_desde) {
      query += ` AND e.expense_date >= $${paramCount}`;
      params.push(fecha_desde);
      paramCount++;
    }

    if (fecha_hasta) {
      query += ` AND e.expense_date <= $${paramCount}`;
      params.push(fecha_hasta);
      paramCount++;
    }

    if (category_id) {
      query += ` AND e.category_id = $${paramCount}`;
      params.push(category_id);
      paramCount++;
    }

    if (status) {
      query += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND e.description ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY e.expense_date DESC`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.status(200).json({
      expenses: result.rows
    });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    // Obtener el usuario por email
    const userEmail = req.user.email;
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const userId = userResult.rows[0].id;
    const { description, amount, date, category_id, payment_method, capture_channel } = req.body;

    // Validate input
    if (!description || !amount || !date || !category_id) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos',
        code: 'MISSING_FIELDS'
      });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: 'El monto debe ser un número positivo',
        code: 'INVALID_AMOUNT'
      });
    }

    const result = await pool.query(
      `INSERT INTO expenses (user_id, description, amount, expense_date, category_id, payment_method, capture_channel, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, description, amount, expense_date, category_id`,
      [userId, description, amountNum, date, category_id, payment_method || null, capture_channel || 'manual', 'confirmed']
    );

    res.status(201).json({
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear gasto:', error);
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { description, amount, date, category_id } = req.body;

    // Validate input
    if (!description || !amount || !date || !category_id) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos',
        code: 'MISSING_FIELDS'
      });
    }

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Gasto no encontrado',
        code: 'NOT_FOUND'
      });
    }

    const result = await pool.query(
      `UPDATE expenses
       SET description = $1, amount = $2, expense_date = $3, category_id = $4
       WHERE id = $5 AND user_id = $6
       RETURNING id, description, amount, expense_date, category_id`,
      [description, amount, date, category_id, id, userId]
    );

    res.status(200).json({
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Gasto no encontrado',
        code: 'NOT_FOUND'
      });
    }

    await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.status(200).json({
      message: 'Gasto eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    next(error);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
        SUM(amount) as total,
        COUNT(*) as count,
        AVG(amount) as average
       FROM expenses
       WHERE user_id = $1`,
      [userId]
    );

    res.status(200).json({
      summary: {
        total: result.rows[0].total || 0,
        count: parseInt(result.rows[0].count) || 0,
        average: result.rows[0].average ? parseFloat(result.rows[0].average) : 0
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    next(error);
  }
};
