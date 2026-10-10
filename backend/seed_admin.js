import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Admin from './models/Admin.js';

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // 1. Seed into dedicated 'admins' collection
    const existingAdminDoc = await Admin.findOne({ email: ADMIN_EMAIL });
    if (existingAdminDoc) {
      existingAdminDoc.username = ADMIN_USERNAME;
      existingAdminDoc.password = hashedPassword;
      existingAdminDoc.role = 'admin';
      await existingAdminDoc.save();
      console.log(`Updated existing document in 'admins' collection for: ${ADMIN_EMAIL}`);
    } else {
      const createdAdmin = await Admin.create({
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: 'admin',
        designation: 'Head Placement Officer',
        department: 'Training & Placement Cell',
        phone_number: '+91-9876543210',
        permissions: ['manage_drives', 'manage_students', 'manage_eligibility', 'system_admin']
      });
      console.log(`Successfully created new document in 'admins' collection:`);
      console.log(`ID: ${createdAdmin._id} | Collection: admins | Email: ${createdAdmin.email}`);
    }

    // 2. Also ensure User collection has role: 'admin'
    const existingUser = await User.findOne({ email: ADMIN_EMAIL });
    if (existingUser) {
      existingUser.role = 'admin';
      existingUser.username = ADMIN_USERNAME;
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log(`Updated existing user in 'users' collection to role: admin`);
    } else {
      const newAdminUser = await User.create({
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: 'admin',
        dob: new Date('1990-01-01'),
        phone_number: '+91-9876543210'
      });
      console.log(`Created admin user in 'users' collection: ID: ${newAdminUser._id}`);
    }

    console.log('\n--- ADMIN SEED COMPLETE ---');
    console.log(`Login URL: /placement/admin or /admin`);
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Collections populated: 'admins' and 'users'`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
