import express from 'express';
import {
  getLoans,
  getLoansByInvestor,
  addLoan,
  updateLoan,
  addLoanPayment,
  deleteLoan,
  getLoanById,
  getLoanStats
} from '../controllers/loanController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all loans (admin only)
router.get('/', getLoans);

// Get loan statistics (admin only)
router.get('/stats', getLoanStats);

// Get loans by investor ID
router.get('/investor/:investorId', getLoansByInvestor);

// Get loan by ID
router.get('/:id', getLoanById);

// Add new loan (admin only)
router.post('/', addLoan);

// Update loan (admin only)
router.put('/:id', updateLoan);

// Add payment to loan (admin only)
router.post('/:id/payment', addLoanPayment);

// Delete loan (admin only)
router.delete('/:id', deleteLoan);

export default router;
