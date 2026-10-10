import React, { useState, useContext, useEffect } from 'react';
import { 
  X, Mail, Lock, UserPlus, Key, LogIn, Send, User as UserIcon, 
  Phone, Calendar, ShieldCheck, GraduationCap, AlertCircle, CheckCircle, Briefcase, Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const AuthModal = ({ isOpen, onClose, initialMode = 'login', initialRole = 'user' }) => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [mode, setMode] = useState(initialMode); // login | register | forgot | reset
    const [roleChoice, setRoleChoice] = useState(initialRole); // 'user' | 'admin'
    
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setRoleChoice(initialRole);
        }
    }, [isOpen, initialMode, initialRole]);

    // Form fields
    const [username, setUsername] = useState('');
    const [dob, setDob] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [designation, setDesignation] = useState('Placement Officer');
    const [department, setDepartment] = useState('Training & Placement Cell');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Switch between Candidate and Admin role
    const handleRoleSwitch = (targetRole) => {
        setRoleChoice(targetRole);
        setError('');
        setMsg('');
        if (targetRole === 'admin') {
            if (mode === 'login' && (!email || email === 'candidate@university.edu')) {
                setEmail('admin@placement.edu');
                setPassword('admin123');
            }
        } else {
            if (email === 'admin@placement.edu') setEmail('');
            if (password === 'admin123') setPassword('');
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setMsg(''); setLoading(true);
        try {
            if (mode === 'login') {
                const res = await axios.post('/api/auth/login', { 
                    email, 
                    password, 
                    loginAsRole: roleChoice 
                });
                
                login(res.data.token, res.data.email, res.data.role, res.data.username);
                onClose();

                // If logged in as admin, redirect directly to the Placement Admin Console
                if (res.data.role === 'admin') {
                    navigate('/admin');
                }
            } else if (mode === 'register') {
                const res = await axios.post('/api/auth/register', { 
                    username, 
                    email, 
                    dob, 
                    password, 
                    phone_number: phone,
                    role: roleChoice,
                    designation: roleChoice === 'admin' ? designation : undefined,
                    department: roleChoice === 'admin' ? department : undefined
                });

                login(res.data.token, res.data.email, res.data.role, res.data.username);
                onClose();

                if (res.data.role === 'admin') {
                    navigate('/admin');
                }
            } else if (mode === 'forgot') {
                const res = await axios.post('/api/auth/forgot-password', { email });
                setMsg(res.data.message);
                if (res.data.demoOtp) {
                    setOtp(res.data.demoOtp);
                }
                setMode('reset');
            } else if (mode === 'reset') {
                const res = await axios.post('/api/auth/reset-password', { email, otp, newPassword });
                setMsg(res.data.message);
                setTimeout(() => setMode('login'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', animation: 'fadeIn 0.3s ease-out', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                
                {/* Close Button */}
                <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'var(--transition)' }}>
                    <X size={22} />
                </button>
                
                {/* Modal Title */}
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.2rem' }}>
                        {mode === 'login' 
                            ? (roleChoice === 'admin' ? 'ADMINISTRATOR SIGN IN' : 'CANDIDATE SIGN IN') 
                            : mode === 'register' 
                                ? (roleChoice === 'admin' ? 'ADMINISTRATOR REGISTRATION' : 'NEW CANDIDATE REGISTRATION')
                                : mode === 'forgot' ? 'ACCOUNT RECOVERY' : 'VERIFY OTP OVERRIDE'}
                    </h2>
                    <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                        {mode === 'login' 
                            ? (roleChoice === 'admin' ? 'Placement Officer & Administration Management Access' : 'Sign in to analyze resumes & track placement recruitment drives')
                            : mode === 'register'
                                ? (roleChoice === 'admin' ? 'Register dedicated Placement Officer account' : 'Register new candidate account to access ATS tools')
                                : 'Fill in your verification credentials below'}
                    </p>
                </div>

                {/* ROLE SELECTION TOGGLE (Available in Login and Register modes) */}
                {(mode === 'login' || mode === 'register') && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(0,0,0,0.3)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <button
                            type="button"
                            onClick={() => handleRoleSwitch('user')}
                            style={{
                                padding: '0.55rem',
                                borderRadius: '7px',
                                border: 'none',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                background: roleChoice === 'user' ? 'var(--primary-color)' : 'transparent',
                                color: roleChoice === 'user' ? '#000' : 'var(--text-muted)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <GraduationCap size={16} /> Candidate / User
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleSwitch('admin')}
                            style={{
                                padding: '0.55rem',
                                borderRadius: '7px',
                                border: 'none',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                background: roleChoice === 'admin' ? '#6366f1' : 'transparent',
                                color: roleChoice === 'admin' ? '#fff' : 'var(--text-muted)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <ShieldCheck size={16} /> Admin Portal
                        </button>
                    </div>
                )}

                {/* Admin Demo Credentials Hint Banner (in Login mode) */}
                {mode === 'login' && roleChoice === 'admin' && (
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.78rem', color: '#c7d2fe' }}>
                        <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: '0.15rem' }}>🔑 Master Admin Demo Credentials:</div>
                        <div>Email: <code>admin@placement.edu</code> | Pass: <code>admin123</code></div>
                    </div>
                )}

                {error && (
                    <div style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '0.65rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                {msg && (
                    <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.65rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <CheckCircle size={16} /> {msg}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    
                    {/* Register Fields (Common + Role Specific) */}
                    {mode === 'register' && (
                        <>
                            <div style={{ position: 'relative' }}>
                                <UserIcon size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" 
                                    placeholder={roleChoice === 'admin' ? "Officer Full Name" : "Candidate Full Name"} 
                                    required 
                                    value={username} 
                                    onChange={e=>setUsername(e.target.value)} 
                                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                                />
                            </div>

                            <div style={{ position: 'relative' }}>
                                <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="date" 
                                    required 
                                    value={dob} 
                                    onChange={e=>setDob(e.target.value)} 
                                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none', colorScheme: 'dark' }} 
                                />
                            </div>

                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="tel" 
                                    placeholder={roleChoice === 'admin' ? "Officer Contact Number" : "Phone Number"} 
                                    required 
                                    value={phone} 
                                    onChange={e=>setPhone(e.target.value)} 
                                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                                />
                            </div>

                            {/* Extra admin designation fields */}
                            {roleChoice === 'admin' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Briefcase size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input 
                                            type="text" 
                                            placeholder="Designation" 
                                            value={designation} 
                                            onChange={e=>setDesignation(e.target.value)} 
                                            style={{ width: '100%', padding: '0.75rem 0.6rem 0.75rem 2rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '0.8rem' }} 
                                        />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <Building size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input 
                                            type="text" 
                                            placeholder="Department" 
                                            value={department} 
                                            onChange={e=>setDepartment(e.target.value)} 
                                            style={{ width: '100%', padding: '0.75rem 0.6rem 0.75rem 2rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '0.8rem' }} 
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Email Input */}
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder={roleChoice === 'admin' ? "Admin University Email" : "Email Address"} 
                            required 
                            value={email} 
                            onChange={e=>setEmail(e.target.value)} 
                            disabled={mode==='reset'} 
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                        />
                    </div>

                    {/* Password Input */}
                    {(mode === 'login' || mode === 'register') && (
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="password" 
                                placeholder={roleChoice === 'admin' ? "Admin Secret Password" : "Password"} 
                                required 
                                value={password} 
                                onChange={e=>setPassword(e.target.value)} 
                                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                            />
                        </div>
                    )}

                    {/* Reset OTP & New Password */}
                    {mode === 'reset' && (
                        <>
                            <div style={{ position: 'relative' }}>
                                <Key size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="6-Digit OTP" required value={otp} onChange={e=>setOtp(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none' }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="password" placeholder="New Password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none' }} />
                            </div>
                        </>
                    )}

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading} 
                        style={{ 
                            width: '100%', 
                            padding: '0.8rem', 
                            background: roleChoice === 'admin' && (mode === 'login' || mode === 'register') ? '#6366f1' : 'var(--primary-color)', 
                            color: roleChoice === 'admin' && (mode === 'login' || mode === 'register') ? '#fff' : '#000', 
                            border: 'none', 
                            borderRadius: '8px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer', 
                            marginTop: '0.4rem', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading 
                            ? 'PROCESSING...' 
                            : mode === 'login' 
                                ? (roleChoice === 'admin' ? <><ShieldCheck size={18}/> SIGN IN AS ADMIN</> : <><LogIn size={18}/> SIGN IN AS CANDIDATE</>) 
                                : mode === 'register' 
                                    ? (roleChoice === 'admin' ? <><ShieldCheck size={18}/> REGISTER AS ADMINISTRATOR</> : <><UserPlus size={18}/> CREATE CANDIDATE ACCOUNT</>) 
                                    : mode === 'forgot' ? <><Send size={18}/> TRANSMIT OTP</> 
                                    : 'CONFIRM OVERRIDE'}
                    </button>
                    
                </form>

                {/* Footer Navigation Switchers */}
                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'center', fontSize: '0.82rem' }}>
                    {mode === 'login' && (
                        <>
                            <span style={{ color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('forgot'); setError(''); setMsg(''); }}>
                                {roleChoice === 'admin' ? 'Forgot Admin Password?' : 'Forgot Password?'}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                                {roleChoice === 'admin' ? (
                                    <>New Administrator? <span style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setMode('register'); setError(''); setMsg(''); }}>Register Admin Account</span></>
                                ) : (
                                    <>No candidate clearance? <span style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setMode('register'); setError(''); setMsg(''); }}>Request Access</span></>
                                )}
                            </span>
                        </>
                    )}

                    {mode === 'register' && (
                        <span style={{ color: 'var(--text-muted)' }}>
                            Already have an account? <span style={{ color: roleChoice === 'admin' ? '#818cf8' : 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setMode('login'); setError(''); setMsg(''); }}>Return to Sign In</span>
                        </span>
                    )}

                    {(mode === 'forgot' || mode === 'reset') && (
                        <span style={{ color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('login'); setError(''); setMsg(''); }}>
                            Return to Login
                        </span>
                    )}
                </div>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
};

export default AuthModal;
