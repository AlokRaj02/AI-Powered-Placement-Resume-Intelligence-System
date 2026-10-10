import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

export const seedAdminUser = async () => {
    try {
        const adminEmail = (process.env.ADMIN_EMAIL || 'admin@placement.edu').trim().toLowerCase();
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', salt);
            await User.create({
                email: adminEmail,
                username: 'Placement Super Admin',
                password: hashedPassword,
                role: 'admin',
                dob: new Date('1990-01-01'),
                phone_number: '+1-555-0199'
            });
            console.log(`[MongoDB] Default Admin user successfully seeded: ${adminEmail}`);
        } else if (existingAdmin.role !== 'admin') {
            existingAdmin.role = 'admin';
            await existingAdmin.save();
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
