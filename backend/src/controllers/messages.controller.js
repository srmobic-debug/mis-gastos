import pool from '../config/database.js';

export const getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, limit = '30', offset = '0' } = req.query;

    let query = `SELECT
      m.id,
      m.user_id,
      u.name as user_name,
      u.phone as user_phone,
      m.channel_message_id,
      m.message_type,
      m.raw_text,
      m.capture_channel,
      m.processing_status,
      m.error_reason,
      m.processed_at,
      m.created_at,
      e.id as expense_id,
      e.amount as expense_amount,
      e.status as expense_status,
      c.name as expense_category,
      c.icon as expense_category_icon
    FROM messages m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN expenses e ON e.message_id = m.id
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE m.user_id = $1`;

    const params = [userId];
    let paramCount = 2;

    if (status) {
      query += ` AND m.processing_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY m.created_at DESC`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.status(200).json({
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    next(error);
  }
};

export const reprocessMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM messages WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Mensaje no encontrado',
        code: 'NOT_FOUND'
      });
    }

    // Reset processing status to pending
    const result = await pool.query(
      `UPDATE messages
       SET processing_status = 'pending', error_reason = NULL, processed_at = NULL
       WHERE id = $1 AND user_id = $2
       RETURNING id, processing_status`,
      [id, userId]
    );

    res.status(200).json({
      message: result.rows[0]
    });
  } catch (error) {
    console.error('Error al reprocesar mensaje:', error);
    next(error);
  }
};
