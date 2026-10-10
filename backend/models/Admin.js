import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        default: 'admin' 
    },
    designation: {
        type: String,
        default: 'Placement Officer'
    },
    department: {
        type: String,
        default: 'Training & Placement Cell'
    },
    phone_number: { 
        type: String, 
        default: '+91-9876543210' 
    },
    permissions: {
        type: [String],
        default: ['manage_drives', 'manage_students', 'manage_eligibility', 'system_admin']
    },
    last_login: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true,
    collection: 'admins' // Explicitly create and store in the 'admins' collection
});

export default mongoose.models.Admin || mongoose.model('Admin', adminSchema);
