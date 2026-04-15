import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getSummary
} from '../controllers/expenses.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.get('/summary/total', getSummary);

export default router;
