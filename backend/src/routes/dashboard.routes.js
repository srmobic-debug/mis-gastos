import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getSummary,
  getCategories,
  getDaily
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/summary', getSummary);
router.get('/categories', getCategories);
router.get('/daily', getDaily);

export default router;
