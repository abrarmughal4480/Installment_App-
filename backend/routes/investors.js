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
  distributeProfits
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

// GET /api/investors/dashboard - Get investor dashboard data (investors can access their own dashboard)
router.get('/dashboard', getInvestorDashboard);

// GET /api/investors/profit-history - Get investor profit history (investors can access their own history)
router.get('/profit-history', getInvestorProfitHistory);

// POST /api/investors/update-profit - Update monthly profit (main admin only)
router.post('/update-profit', requireMainAdmin, updateMonthlyProfit);

// GET /api/investors/:id - Get investor by ID (requires view permission)
router.get('/:id', requireViewPermission, getInvestorById);

// PUT /api/investors/:id - Update investor (requires add permission)
router.put('/:id', requireAddPermission, updateInvestor);

// DELETE /api/investors/:id - Delete investor (requires add permission)
router.delete('/:id', requireAddPermission, deleteInvestor);

// POST /api/investors/distribute-profits - Distribute profits among investors (main admin only)
router.post('/distribute-profits', requireMainAdmin, distributeProfits);

export default router;
