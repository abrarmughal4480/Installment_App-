import express from 'express';
import { 
  getInvestors, 
  addInvestor, 
  updateInvestor, 
  deleteInvestor, 
  getInvestorById,
  getInvestorDashboard,
  updateMonthlyProfit,
  getInvestorProfitHistory
} from '../controllers/investorController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/investors - Get all investors
router.get('/', getInvestors);

// POST /api/investors - Add new investor
router.post('/', addInvestor);

// GET /api/investors/dashboard - Get investor dashboard data
router.get('/dashboard', getInvestorDashboard);

// GET /api/investors/profit-history - Get investor profit history
router.get('/profit-history', getInvestorProfitHistory);

// POST /api/investors/update-profit - Update monthly profit (admin only)
router.post('/update-profit', updateMonthlyProfit);

// GET /api/investors/:id - Get investor by ID
router.get('/:id', getInvestorById);

// PUT /api/investors/:id - Update investor
router.put('/:id', updateInvestor);

// DELETE /api/investors/:id - Delete investor
router.delete('/:id', deleteInvestor);

export default router;
