import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resume_analyzer';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@placement.edu').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Placement Super Admin';

async function seedAdmin() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully.');

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    if (existing) {
      existing.role = 'admin';
      existing.username = ADMIN_USERNAME;
      existing.password = hashedPassword;
      await existing.save();
      console.log(`Successfully updated existing user to Admin:`);
      console.log(`Email: ${ADMIN_EMAIL}`);
      console.log(`Role: ${existing.role}`);
      console.log(`Password reset to: ${ADMIN_PASSWORD}`);
    } else {
      const newAdmin = await User.create({
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: 'admin',
        dob: new Date('1990-01-01'),
        phone_number: '+1-555-0199'
      });
      console.log(`Successfully created new Admin user in MongoDB:`);
      console.log(`ID: ${newAdmin._id}`);
      console.log(`Email: ${newAdmin.email}`);
      console.log(`Role: ${newAdmin.role}`);
      console.log(`Password: ${ADMIN_PASSWORD}`);
    }

    console.log('\nAdmin database setup is complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin into database:', err.message);
    process.exit(1);
  }
}

seedAdmin();
