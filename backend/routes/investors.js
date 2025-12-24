import express from 'express';
import { 
  getInvestors, 
  addInvestor, 
  updateInvestor, 
  deleteInvestor, 
  getInvestorById,
  getInvestorDashboard,
  updateMonthlyProfit,
  getInvestorProfitHistory,
  updateInvestorProfitHistory,
  distributeProfits,
  saveCurrentMonthProfit
} from '../controllers/investorController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireViewPermission, requireAddPermission, requireMainAdmin } from '../middleware/permissions.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/investors - Get all investors (requires view permission)
router.get('/', requireViewPermission, getInvestors);

// POST /api/investors - Add new investor (requires add permission)
router.post('/', requireAddPermission, addInvestor);

// Specific routes (must be before parameterized routes)
// GET /api/investors/dashboard - Get investor dashboard data (investors can access their own dashboard)
router.get('/dashboard', getInvestorDashboard);

// GET /api/investors/profit-history - Get investor profit history (investors can access their own history)
router.get('/profit-history', getInvestorProfitHistory);

// PUT /api/investors/profit-history - Update investor profit history
router.put('/profit-history', updateInvestorProfitHistory);

// POST /api/investors/update-profit - Update monthly profit (main admin only)
router.post('/update-profit', requireMainAdmin, updateMonthlyProfit);

// POST /api/investors/distribute-profits - Distribute profits among investors (main admin only)
router.post('/distribute-profits', requireMainAdmin, distributeProfits);

// POST /api/investors/save-current-month-profit - Save current month profit with balance entries (main admin only)
router.post('/save-current-month-profit', requireMainAdmin, saveCurrentMonthProfit);

// Parameterized routes (must be after specific routes)
// GET /api/investors/:id - Get investor by ID (requires view permission)
router.get('/:id', requireViewPermission, getInvestorById);

// PUT /api/investors/:id - Update investor (requires add permission)
router.put('/:id', requireAddPermission, updateInvestor);

// DELETE /api/investors/:id - Delete investor (requires add permission)
router.delete('/:id', requireAddPermission, deleteInvestor);

export default router;
