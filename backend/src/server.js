import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import expensesRoutes from './routes/expenses.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

// Importar middleware
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(express.json());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== RUTAS =====
// API v1 (versión actual)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// API sin versión (para compatibilidad con frontend)
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/categories', categoriesRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: '✅ Backend funcionando correctamente' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: '✅ Backend funcionando correctamente' });
});

// ===== ERROR HANDLER =====
app.use(errorHandler);

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Backend iniciado correctamente    ║
║  📍 http://localhost:${PORT}            ║
║  🔗 http://localhost:${PORT}/api/v1     ║
╚════════════════════════════════════════╝
  `);
});
