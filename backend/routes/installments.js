import express from 'express';
import {
  getInstallments,
  getInstallment,
  createInstallments,
  payInstallment,
  updatePayment,
  markInstallmentUnpaid,
  updateInstallment,
  deleteInstallment,
  getCustomerInstallments
} from '../controllers/installmentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireViewPermission, requireAddPermission } from '../middleware/permissions.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/customer/:customerId', getCustomerInstallments); // Get customer installments with customer info
router.get('/details/:installmentId', getInstallment); // Get single installment with full details (public for customers)

// All other routes require authentication
router.use(authenticateToken);

// Installment routes with permission checks
router.get('/', requireViewPermission, getInstallments); // Get all installments (requires view permission)
router.get('/:installmentId', requireViewPermission, getInstallment); // Get single installment (requires view permission)
router.post('/', requireAddPermission, createInstallments); // Create installments for customer (requires add permission)
router.put('/:installmentId/pay', requireAddPermission, payInstallment); // Mark installment as paid (requires add permission)
router.put('/:installmentId/update-payment', requireAddPermission, updatePayment); // Update existing payment details (requires add permission)
router.put('/:installmentId/mark-unpaid', requireAddPermission, markInstallmentUnpaid); // Mark paid installment as unpaid (requires add permission)
router.put('/:installmentId', requireAddPermission, updateInstallment); // Update installment (requires add permission)
router.delete('/:installmentId', requireAddPermission, deleteInstallment); // Delete installment (requires add permission)

export default router;
