import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { connectDB } from './db.js';
import Analysis from './models/Analysis.js';
import User from './models/User.js';
import Admin from './models/Admin.js';
import { protect, optionalAuth } from './middleware/auth.js';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import placementRoutes from './placementRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express.json());

// Mount Placement Routes
app.use('/api/p06', placementRoutes);

// Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
    res.json({ message: "AI Resume Analyzer API is running successfully!" });
});


// File upload setup (store in memory for quick processing)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// System prompt for structured AI response
const AI_PROMPT = `You are an expert ATS (Applicant Tracking System) and senior recruiter.
Given a candidate's resume text and a job description, analyze how well they match.
You must return only a valid JSON response with the following structure, and nothing else (no markdown wrappers like \`\`\`json):
{
  "score": <number between 0 and 100 representing the match percentage>,
  "missing_skills": ["skill1", "skill2"],
  "skills_breakdown": [
    { "name": "Skill Name 1", "score": <number between 0 and 100 representing match percentage> }
  ],
  "cv_explanations": [
    { "skill": "Skill/Technology Name", "description": "A 1-2 sentence brief educational explanation of what this technology, skill, or concept is and what it is used for." }
  ],
  "feedback": {
    "suggestions": ["suggestion1", "suggestion2"],
    "ats_tips": ["tip1", "tip2"]
  }
}
Please extract the top 4 key skills/competencies required in the job description and score how well the candidate matches each. Also, identify the main technologies, languages, frameworks, or methodologies present in the candidate's CV, and provide a brief (1-2 sentences) educational description explaining what each is.
`;

/**
 * Authentication Routes
 */
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, dob, password, phone_number } = req.body;
        if (!email || !password || !username || !dob || !phone_number) return res.status(400).json({ error: "All fields are required" });
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: "User already exists" });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({ username, email, dob, password: hashedPassword, phone_number });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret_cyber_ai', { expiresIn: '30d' });
        res.status(201).json({ token, id: user._id, email: user.email });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, loginAsRole } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const inputIdentifier = email.trim().toLowerCase();
        const adminEmail = (process.env.ADMIN_EMAIL || 'admin@placement.edu').toLowerCase();
        const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

        // 1. If user selected Admin role, check dedicated Admins collection first
        if (loginAsRole === 'admin') {
            let adminDoc = await Admin.findOne({
                $or: [
                    { email: inputIdentifier },
                    { username: new RegExp(`^${inputIdentifier}$`, 'i') }
                ]
            });

            // Check if master credentials match
            if (!adminDoc && (inputIdentifier === adminEmail || inputIdentifier === 'admin') && password === adminPass) {
                try {
                    const salt = await bcrypt.genSalt(10);
                    const hashed = await bcrypt.hash(adminPass, salt);
                    adminDoc = await Admin.create({
                        email: adminEmail,
                        username: 'Placement Super Admin',
                        password: hashed,
                        role: 'admin',
                        designation: 'Head Placement Officer',
                        department: 'Training & Placement Cell',
                        phone_number: '+91-9876543210'
                    });
                } catch (seedErr) {
                    console.error('Error auto-creating Admin doc:', seedErr.message);
                }
            }

            // Fallback check in User collection with role: 'admin'
            if (!adminDoc) {
                const userAdmin = await User.findOne({
                    $or: [
                        { email: inputIdentifier },
                        { username: new RegExp(`^${inputIdentifier}$`, 'i') }
                    ],
                    role: 'admin'
                });
                if (userAdmin) adminDoc = userAdmin;
            }

            if (adminDoc) {
                const isMatch = adminDoc.password === adminPass || (await bcrypt.compare(password, adminDoc.password));
                if (isMatch) {
                    if (adminDoc.save && typeof adminDoc.save === 'function' && adminDoc.last_login !== undefined) {
                        adminDoc.last_login = new Date();
                        await adminDoc.save().catch(() => {});
                    }

                    const token = jwt.sign(
                        { id: adminDoc._id, role: 'admin', email: adminDoc.email, name: adminDoc.username },
                        process.env.JWT_SECRET || 'fallback_secret_cyber_ai',
                        { expiresIn: '30d' }
                    );
                    return res.json({
                        token,
                        id: adminDoc._id,
                        email: adminDoc.email,
                        role: 'admin',
                        username: adminDoc.username,
                        designation: adminDoc.designation || 'Placement Officer'
                    });
                }
            }

            return res.status(401).json({ error: "Invalid administrator email or password" });
        }

        // 2. Candidate / User Authentication
        const user = await User.findOne({
            $or: [
                { email: inputIdentifier },
                { username: new RegExp(`^${inputIdentifier}$`, 'i') }
            ]
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            const userRole = user.role || 'user';
            const token = jwt.sign(
                { id: user._id, role: userRole, email: user.email, name: user.username },
                process.env.JWT_SECRET || 'fallback_secret_cyber_ai',
                { expiresIn: '30d' }
            );
            return res.json({
                token,
                id: user._id,
                email: user.email,
                role: userRole,
                username: user.username
            });
        }

        // Fallback check for configured admin credentials if candidate accidentally entered it in user tab
        if ((inputIdentifier === adminEmail || inputIdentifier === 'admin') && password === adminPass) {
            const token = jwt.sign(
                { id: 'admin_root', role: 'admin', email: adminEmail, name: 'Placement Super Admin' },
                process.env.JWT_SECRET || 'fallback_secret_cyber_ai',
                { expiresIn: '30d' }
            );
            return res.json({
                token,
                id: 'admin_root',
                email: adminEmail,
                role: 'admin',
                username: 'Placement Super Admin'
            });
        }

        res.status(401).json({ error: "Invalid email or password" });
    } catch (e) {
        console.error("Login error:", e);
        res.status(500).json({ error: "Login failed" });
    }
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = await bcrypt.hash(otp, 10);
        user.otpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ error: "Email provider not configured on server." });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'RESUME AI: Password Reset OTP',
            text: `SYSTEM OVERRIDE INITIATED.\n\nYour Authorization OTP is: ${otp}\n\nThis OTP expires in 10 minutes.`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "OTP sent to email" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to send email" });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !user.resetOtp || !user.otpExpiry) return res.status(400).json({ error: "Invalid request" });
        if (Date.now() > user.otpExpiry) return res.status(400).json({ error: "OTP expired" });

        const isMatch = await bcrypt.compare(otp, user.resetOtp);
        if (!isMatch) return res.status(400).json({ error: "Invalid OTP" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetOtp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (e) {
        res.status(500).json({ error: "Password reset failed" });
    }
});

/**
 * Endpoint to analyze resume and job description
 */
app.post('/api/analyze', optionalAuth, upload.single('resume'), async (req, res) => {
    try {
        const { job_description, resume_text: body_resume_text } = req.body;
        const file = req.file;

        if (!job_description) {
            return res.status(400).json({ error: "Missing job description" });
        }
        if (!file && !body_resume_text) {
            return res.status(400).json({ error: "Missing resume file or resume text" });
        }

        // 1. Extract or use text
        let resume_text = '';
        if (file) {
            if (file.mimetype === 'application/pdf') {
                const pdfData = await pdfParse(file.buffer);
                resume_text = pdfData.text;
            } else if (file.originalname && file.originalname.toLowerCase().endsWith('.docx')) {
                const docxData = await mammoth.extractRawText({ buffer: file.buffer });
                resume_text = docxData.value;
            } else {
                // Basic fallback for pure text
                resume_text = file.buffer.toString('utf8');
            }
        } else {
            resume_text = body_resume_text;
        }

        // 2. Call AI API
        const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: [
                 { text: AI_PROMPT },
                 { text: `RESUME:\n${resume_text}\n\nJOB DESCRIPTION:\n${job_description}` }
             ],
             config: {
                 responseMimeType: 'application/json'
             }
        });
        const aiText = response.text;

        let aiResult;
        try {
            const startIdx = aiText.indexOf('{');
            const endIdx = aiText.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) {
                aiResult = JSON.parse(aiText.substring(startIdx, endIdx + 1));
            } else {
                aiResult = JSON.parse(aiText);
            }
        } catch (e) {
            console.error("JSON Parsing Error from AI:", e);
            return res.status(500).json({ error: "AI returned invalid JSON", details: aiText });
        }

        // 3. Save to database
        const newAnalysis = await Analysis.create({
            userId: req.user ? req.user._id : undefined,
            resume_text,
            job_description,
            score: aiResult.score,
            missing_skills: aiResult.missing_skills,
            skills_breakdown: aiResult.skills_breakdown || [],
            cv_explanations: aiResult.cv_explanations || [],
            feedback: aiResult.feedback,
            ai_model: 'gemini'
        });
        
        // 4. Return result
        res.json({
            id: newAnalysis._id,
            score: newAnalysis.score,
            missing_skills: newAnalysis.missing_skills,
            skills_breakdown: newAnalysis.skills_breakdown || [],
            cv_explanations: newAnalysis.cv_explanations || [],
            feedback: newAnalysis.feedback,
            created_at: newAnalysis.created_at,
            resume_text: newAnalysis.resume_text,
            job_description: newAnalysis.job_description
        });

    } catch (err) {
        console.error("Analysis Error:", err);
        res.status(500).json({ error: err.message || "An error occurred during analysis" });
    }
});

/**
 * Endpoint to suggest resume bullet points incorporating a missing skill
 */
app.post('/api/optimize/suggest', optionalAuth, async (req, res) => {
    try {
        const { resume_text, job_description, missing_skill } = req.body;

        if (!resume_text || !job_description || !missing_skill) {
            return res.status(400).json({ error: "Missing resume text, job description, or missing skill" });
        }

        const SUGGEST_PROMPT = `You are a professional ATS resume optimizer and recruiter.
Given a candidate's resume text, a target job description, and a specific missing skill, generate 3 tailored, highly professional bullet points or achievement statements that the candidate can naturally add to their resume to demonstrate experience/proficiency with the missing skill.
Guidelines:
1. Make them sound realistic based on the candidate's existing background (do not invent grand titles, but frame skills realistically in tech/engineering contexts).
2. Align them with the context of the job description.
3. Keep each suggestion concise (1-2 sentences).
4. Return only a valid JSON response with the following structure, and nothing else (no markdown wrappers like \`\`\`json):
{
  "bullet_points": [
    "Generated bullet point 1",
    "Generated bullet point 2",
    "Generated bullet point 3"
  ]
}`;

        const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: [
                 { text: SUGGEST_PROMPT },
                 { text: `CANDIDATE RESUME:\n${resume_text}\n\nTARGET JOB DESCRIPTION:\n${job_description}\n\nMISSING SKILL TO INTEGRATE:\n${missing_skill}` }
             ],
             config: {
                 responseMimeType: 'application/json'
             }
        });

        const aiText = response.text;
        let aiResult;
        try {
            const startIdx = aiText.indexOf('{');
            const endIdx = aiText.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) {
                aiResult = JSON.parse(aiText.substring(startIdx, endIdx + 1));
            } else {
                aiResult = JSON.parse(aiText);
            }
        } catch (e) {
            console.error("JSON Parsing Error from AI suggest:", e);
            return res.status(500).json({ error: "AI returned invalid JSON", details: aiText });
        }

        res.json(aiResult);
    } catch (err) {
        console.error("Suggest Error:", err);
        res.status(500).json({ error: err.message || "An error occurred during suggestion generation" });
    }
});

/**
 * Endpoint to get history
 */
app.get('/api/history', protect, async (req, res) => {
    try {
        const history = await Analysis.find({ userId: req.user._id }).sort({ created_at: -1 }).limit(20);
        
        // Map History to match previous shape if needed
        const result = history.map(item => ({
            id: item._id,
            score: item.score,
            missing_skills: item.missing_skills,
            skills_breakdown: item.skills_breakdown || [],
            cv_explanations: item.cv_explanations || [],
            created_at: item.created_at,
            resume_text: item.resume_text,
            job_description: item.job_description,
            ai_model: item.ai_model || 'gemini'
        }));
        
        res.json(result);
    } catch (err) {
        console.error("History Error:", err);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

/**
 * Endpoint for chatbot assistant
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Missing message parameter" });
        }

        const CHAT_SYSTEM_PROMPT = `You are the AI Chatbot Assistant for the "Resume AI" (AI Resume Analyzer) application.
Your goal is to help users understand this website, explain how its features work, guide them on optimizing their resumes, and answer questions about the project's technical architecture.
Be professional, friendly, concise, and helpful. Keep responses under 4 sentences unless asked for detailed explanations, and format them in clear markdown.

Details about this project & website:
1. What is this app?
   Resume AI is a semantic applicant tracking evaluation engine. It processes resumes (PDF, DOCX) and matches them against job descriptions.
2. Tech Stack:
   - Frontend: React, Vite, Vanilla CSS, Lucide Icons, html2pdf.js.
   - Backend: Node.js, Express, MongoDB/Mongoose.
   - AI Engine: Google Gemini API (gemini-2.5-flash) via @google/genai.
3. Core Features:
   - Hub: Upload resume and paste job description to analyze.
   - Dashboard: Renders an overall match score, skill breakdown progress bars, missing skills gap list, and improvement feedback. Export reports as PDF.
   - Optimizer Sandbox: A live text editor where users edit their CV, get AI-suggested bullet points for missing skills, and instantly rescan to update the score.
   - Knowledge Base (Docs): Extracted educational explanations for every technology/skill found in the user's CV.
   - Archive (History): Logged-in users can browse their past analyses and open them directly in the Sandbox.
4. Themes: Supports Light and Dark mode switching in the top right.

When answering, reference these details. If asked to write a resume bullet point, make it look professional and impact-driven.`;

        // Format history for Gemini API
        // Gemini expects contents to be an array of: { role: 'user'|'model', parts: [{ text: '...' }] }
        const contents = [];
        contents.push({ role: 'user', parts: [{ text: CHAT_SYSTEM_PROMPT }] });
        contents.push({ role: 'model', parts: [{ text: "Understood. I am the Resume AI Assistant. I will help users navigate the site and optimize their resumes." }] });

        if (history && history.length > 0) {
            history.forEach(item => {
                contents.push({
                    role: item.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: item.text }]
                });
            });
        }

        contents.push({ role: 'user', parts: [{ text: message }] });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents
        });

        res.json({ text: response.text });
    } catch (err) {
        console.error("Chatbot Error:", err);
        res.status(500).json({ error: err.message || "An error occurred during chat processing" });
    }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL || process.env.RENDER) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;
