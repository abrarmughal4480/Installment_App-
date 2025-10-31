import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import installmentRoutes from './routes/installments.js';
import dashboardRoutes from './routes/dashboard.js';
import investorRoutes from './routes/investors.js';
import loanRoutes from './routes/loans.js';
import { cleanupExpiredOTP } from './controllers/authController.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = 'mongodb+srv://abrarmughal4481:1122@nobody.7d6kr.mongodb.net/installments_app?retryWrites=true&w=majority&appName=nobody';
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Installment Tracker API Server is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name
    }
  });
});

// Ping endpoint to keep server alive
app.get('/ping', (req, res) => {
  res.json({ 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/loans', loanRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Sorry, the page you\'re looking for doesn\'t exist. Please check the URL and try again.',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Oops! Something went wrong on our end. Please try again in a moment.',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
  console.log(`🌐 Accessible from network at http://192.168.43.120:${PORT}`);
  console.log(`✅ Server started successfully!`);
});

// Schedule periodic cleanup of expired OTP records (every 30 minutes)
setInterval(async () => {
  try {
    await cleanupExpiredOTP();
  } catch (error) {
    console.error('Scheduled cleanup error:', error);
  }
}, 30 * 60 * 1000); // 30 minutes

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    console.log('Process terminated');
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Don't call gracefulShutdown for unhandled rejections to prevent infinite loops
  process.exit(1);
});

export default app;