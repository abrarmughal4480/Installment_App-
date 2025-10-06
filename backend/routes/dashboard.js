import express from 'express';
import { getDashboardStats, addSampleData, getManagers, addManager, deleteManager, updateManager, getAllInstallments } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Dashboard routes (no authentication required for now)
router.get('/stats', getDashboardStats);
router.get('/managers', authenticateToken, getManagers);
router.post('/managers', authenticateToken, addManager);
router.put('/managers/:id', authenticateToken, updateManager);
router.delete('/managers/:id', authenticateToken, deleteManager);
router.post('/sample-data', addSampleData);

// Installments routes - requires authentication for role-based filtering
router.get('/installments', authenticateToken, getAllInstallments);

// Test endpoint to verify data
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard API is working',
    timestamp: new Date().toISOString()
  });
});

export default router;
