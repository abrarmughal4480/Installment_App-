import express from 'express';
import {
  getInstallments,
  getInstallment,
  createInstallments,
  payInstallment,
  updateInstallment,
  deleteInstallment,
  getCustomerInstallments
} from '../controllers/installmentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/customer/:customerId', getCustomerInstallments); // Get customer installments with customer info
router.get('/details/:installmentId', getInstallment); // Get single installment with full details (public for customers)

// All other routes require authentication
router.use(authenticateToken);

// Installment routes
router.get('/', getInstallments); // Get all installments (admin)
router.get('/:installmentId', getInstallment); // Get single installment
router.post('/', createInstallments); // Create installments for customer
router.put('/:installmentId/pay', payInstallment); // Mark installment as paid
router.put('/:installmentId', updateInstallment); // Update installment
router.delete('/:installmentId', deleteInstallment); // Delete installment

export default router;
