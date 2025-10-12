import express from 'express';
import { getDashboardStats, addSampleData, getManagers, addManager, deleteManager, updateManager, getAllInstallments } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireViewPermission, requireAddPermission, requireMainAdmin } from '../middleware/permissions.js';

const router = express.Router();

// Dashboard routes with permission checks
router.get('/stats', requireViewPermission, getDashboardStats);
router.get('/managers', authenticateToken, requireViewPermission, getManagers);
router.post('/managers', authenticateToken, requireAddPermission, addManager);
router.put('/managers/:id', authenticateToken, requireAddPermission, updateManager);
router.delete('/managers/:id', authenticateToken, requireAddPermission, deleteManager);
router.post('/sample-data', requireMainAdmin, addSampleData);

// Installments routes - requires view permission
router.get('/installments', authenticateToken, requireViewPermission, getAllInstallments);

// Test endpoint to verify data
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard API is working',
    timestamp: new Date().toISOString()
  });
});

export default router;
