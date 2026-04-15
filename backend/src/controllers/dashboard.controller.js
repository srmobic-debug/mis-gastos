import pool from '../config/database.js';

export const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { mes } = req.query; // formato: YYYY-MM

    // Mes actual
    let currentMonth = mes;
    if (!currentMonth) {
      const now = new Date();
      currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    // Mes anterior
    const [year, month] = currentMonth.split('-');
    const prevDate = new Date(parseInt(year), parseInt(month) - 2, 1);
    const previousMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Obtener totales del mes actual
    const currentQuery = `
      SELECT
        SUM(amount) as total,
        COUNT(*) as cantidad,
        AVG(amount) as promedio,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as con_error
      FROM expenses
      WHERE user_id = $1 AND TO_CHAR(expense_date, 'YYYY-MM') = $2
    `;
    const currentResult = await pool.query(currentQuery, [userId, currentMonth]);
    const currentRow = currentResult.rows[0];

    // Obtener total del mes anterior
    const prevQuery = `
      SELECT SUM(amount) as total
      FROM expenses
      WHERE user_id = $1 AND TO_CHAR(expense_date, 'YYYY-MM') = $2
    `;
    const prevResult = await pool.query(prevQuery, [userId, previousMonth]);
    const prevRow = prevResult.rows[0];

    res.status(200).json({
      data: {
        total_mes: currentRow.total ? parseFloat(currentRow.total) : 0,
        cantidad: parseInt(currentRow.cantidad) || 0,
        promedio: currentRow.promedio ? parseFloat(currentRow.promedio) : 0,
        total_mes_anterior: prevRow.total ? parseFloat(prevRow.total) : 0,
        pendientes: parseInt(currentRow.pendientes) || 0,
        con_error: parseInt(currentRow.con_error) || 0
      }
    });
  } catch (error) {
    console.error('Error en getSummary:', error);
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { mes } = req.query;

    // Mes actual
    let currentMonth = mes;
    if (!currentMonth) {
      const now = new Date();
      currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const query = `
      SELECT
        c.id,
        c.name,
        c.color,
        c.icon,
        SUM(e.amount) as total,
        COUNT(e.id) as cantidad
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = $1 AND TO_CHAR(e.expense_date, 'YYYY-MM') = $2
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY total DESC NULLS LAST
    `;

    const result = await pool.query(query, [userId, currentMonth]);

    // Calcular total para porcentaje
    const totalGeneral = result.rows.reduce((sum, row) => sum + (row.total ? parseFloat(row.total) : 0), 0);

    res.status(200).json({
      data: result.rows.map(row => {
        const total = row.total ? parseFloat(row.total) : 0;
        return {
          categoria: row.name,
          icono: row.icon,
          color: row.color,
          total,
          cantidad: parseInt(row.cantidad) || 0,
          porcentaje: totalGeneral > 0 ? Math.round((total / totalGeneral) * 100) : 0
        };
      })
    });
  } catch (error) {
    console.error('Error en getCategories:', error);
    next(error);
  }
};

export const getDaily = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        expense_date,
        SUM(amount) as total
      FROM expenses
      WHERE user_id = $1
      GROUP BY expense_date
      ORDER BY expense_date DESC
      LIMIT 30
    `;

    const result = await pool.query(query, [userId]);

    res.status(200).json({
      data: result.rows.map(row => ({
        fecha: row.expense_date.toISOString().split('T')[0],
        total: parseFloat(row.total)
      }))
    });
  } catch (error) {
    console.error('Error en getDaily:', error);
    next(error);
  }
};
