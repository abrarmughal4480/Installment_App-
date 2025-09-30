import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ADMIN_EMAIL = 'admin@installmentadmin.com';
const ADMIN_PASSWORD = 'admininstallment@78612';
const ADMIN_NAME = 'Installment Admin';

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

const setupAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: ADMIN_EMAIL.toLowerCase(),
      type: 'admin'
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`📅 Created: ${existingAdmin.createdAt}`);
      console.log(`🔄 Last Login: ${existingAdmin.lastLogin || 'Never'}`);
      
      // Ask if user wants to update password
      console.log('\n🔄 Updating admin password...');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
      
      existingAdmin.password = hashedPassword;
      existingAdmin.updatedAt = new Date();
      await existingAdmin.save();
      
      console.log('✅ Admin password updated successfully!');
    } else {
      console.log('🆕 Creating new admin user...');
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

      // Create admin user
      const admin = new User({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL.toLowerCase(),
        password: hashedPassword,
        type: 'admin',
        isActive: true,
        lastLogin: null
      });

      await admin.save();

      console.log('✅ Admin user created successfully!');
      console.log(`📧 Email: ${admin.email}`);
      console.log(`👤 Name: ${admin.name}`);
      console.log(`🔐 Type: ${admin.type}`);
      console.log(`📅 Created: ${admin.createdAt}`);
    }

    console.log('\n🎉 Admin setup completed!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n🚀 You can now login to the admin dashboard!');

  } catch (error) {
    console.error('❌ Setup error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the setup
setupAdmin();
