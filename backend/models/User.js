import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true, 
        lowercase: true 
    },
    username: { 
        type: String, 
        required: true 
    },
    dob: { 
        type: Date, 
        required: true 
    },
    phone_number: { 
        type: String, 
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    resetOtp: { 
        type: String 
    },
    otpExpiry: { 
        type: Date 
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
