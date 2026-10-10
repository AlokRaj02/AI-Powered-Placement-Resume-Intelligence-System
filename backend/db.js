import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Admin from './models/Admin.js';

dotenv.config();

export const seedAdminUser = async () => {
    try {
        const adminEmail = (process.env.ADMIN_EMAIL || 'admin@placement.edu').trim().toLowerCase();
        const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPass, salt);

        // 1. Seed into dedicated 'admins' collection
        const existingAdmin = await Admin.findOne({ email: adminEmail });
        if (!existingAdmin) {
            await Admin.create({
                email: adminEmail,
                username: 'Placement Super Admin',
                password: hashedPassword,
                role: 'admin',
                designation: 'Head Placement Officer',
                department: 'Training & Placement Cell',
                phone_number: '+91-9876543210',
                permissions: ['manage_drives', 'manage_students', 'manage_eligibility', 'system_admin']
            });
            console.log(`[MongoDB] Dedicated Admins collection created and seeded: ${adminEmail}`);
        }

        // 2. Also ensure User collection has role: 'admin' for unified authentication
        const existingUser = await User.findOne({ email: adminEmail });
        if (!existingUser) {
            await User.create({
                email: adminEmail,
                username: 'Placement Super Admin',
                password: hashedPassword,
                role: 'admin',
                dob: new Date('1990-01-01'),
                phone_number: '+91-9876543210'
            });
            console.log(`[MongoDB] User collection admin seeded: ${adminEmail}`);
        } else if (existingUser.role !== 'admin') {
            existingUser.role = 'admin';
            await existingUser.save();
            console.log(`[MongoDB] User ${adminEmail} role elevated to admin.`);
        }
    } catch (err) {
        console.error(`[MongoDB] Admin auto-seed note: ${err.message}`);
    }
};

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resume_analyzer');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        await seedAdminUser();
    } catch (err) {
        console.error(`Error connecting to MongoDB: ${err.message}`);
    }
};
