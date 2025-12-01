import express from 'express';
import {
  getLoans,
  getLoansByInvestor,
  addLoan,
  updateLoan,
  addLoanPayment,
  deleteLoan,
  getLoanById,
  getLoanStats,
  addAdditionalAmount
} from '../controllers/loanController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireViewPermission, requireAddPermission, requireMainAdmin } from '../middleware/permissions.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all loans (requires view permission)
router.get('/', requireViewPermission, getLoans);

// Get loan statistics (requires view permission)
router.get('/stats', requireViewPermission, getLoanStats);

// Get loans by investor ID (requires view permission)
router.get('/investor/:investorId', requireViewPermission, getLoansByInvestor);

// Get loan by ID (requires view permission)
router.get('/:id', requireViewPermission, getLoanById);

// Add new loan (requires add permission)
router.post('/', requireAddPermission, addLoan);

// Update loan (requires add permission)
router.put('/:id', requireAddPermission, updateLoan);

// Add payment to loan (requires add permission)
router.post('/:id/payment', requireAddPermission, addLoanPayment);

// Add additional amount to loan (requires add permission)
router.post('/:id/add-amount', requireAddPermission, addAdditionalAmount);

// Delete loan (requires add permission)
router.delete('/:id', requireAddPermission, deleteLoan);

export default router;
