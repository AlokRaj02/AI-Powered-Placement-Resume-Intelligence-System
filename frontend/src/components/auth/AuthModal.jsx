import React, { useState, useContext, useEffect } from 'react';
import { 
  X, Mail, Lock, UserPlus, Key, LogIn, Send, User as UserIcon, 
  Phone, Calendar, ShieldCheck, GraduationCap, AlertCircle, CheckCircle
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
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto pre-fill admin demo credentials when switching to Admin mode if fields are empty
    const handleRoleSwitch = (targetRole) => {
        setRoleChoice(targetRole);
        setError('');
        setMsg('');
        if (targetRole === 'admin') {
            if (!email || email === 'candidate@university.edu') setEmail('admin@placement.edu');
            if (!password) setPassword('admin123');
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
                    navigate('/placement/admin');
                }
            } else if (mode === 'register') {
                const res = await axios.post('/api/auth/register', { 
                    username, 
                    email, 
                    dob, 
                    password, 
                    phone_number: phone 
                });
                login(res.data.token, res.data.email, res.data.role, res.data.username);
                onClose();
            } else if (mode === 'forgot') {
                const res = await axios.post('/api/auth/forgot-password', { email });
                setMsg(res.data.message);
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
            <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', position: 'relative', animation: 'fadeIn 0.3s ease-out', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                
                {/* Close Button */}
                <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'var(--transition)' }}>
                    <X size={22} />
                </button>
                
                {/* Modal Title */}
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.2rem' }}>
                        {mode === 'login' 
                            ? (roleChoice === 'admin' ? 'ADMINISTRATOR LOGIN' : 'CANDIDATE SIGN IN') 
                            : mode === 'register' ? 'NEW CANDIDATE REGISTRATION' 
                            : mode === 'forgot' ? 'ACCOUNT OVERRIDE' : 'VERIFY OTP'}
                    </h2>
                    <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                        {mode === 'login' 
                            ? (roleChoice === 'admin' ? 'Authorized Placement Officer Management Access' : 'Authenticate to evaluate resumes & track placement readiness')
                            : 'Fill in your credentials below'}
                    </p>
                </div>

                {/* ROLE SELECTION TOGGLE (Available in Login mode) */}
                {mode === 'login' && (
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

                {/* Admin Quick Credentials Hint Banner */}
                {mode === 'login' && roleChoice === 'admin' && (
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.78rem', color: '#c7d2fe' }}>
                        <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: '0.15rem' }}>🔑 Predefined Admin Access:</div>
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    
                    {mode === 'register' && (
                        <>
                            <div style={{ position: 'relative' }}>
                                <UserIcon size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="Full Name" required value={username} onChange={e=>setUsername(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none' }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="date" required value={dob} onChange={e=>setDob(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none', colorScheme: 'dark' }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="tel" placeholder="Phone Number" required value={phone} onChange={e=>setPhone(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none' }} />
                            </div>
                        </>
                    )}

                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder={roleChoice === 'admin' ? "Admin Email or Username" : "Email Address"} 
                            required 
                            value={email} 
                            onChange={e=>setEmail(e.target.value)} 
                            disabled={mode==='reset'} 
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                        />
                    </div>

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

                    <button 
                        type="submit" 
                        disabled={loading} 
                        style={{ 
                            width: '100%', 
                            padding: '0.8rem', 
                            background: roleChoice === 'admin' && mode === 'login' ? '#6366f1' : 'var(--primary-color)', 
                            color: roleChoice === 'admin' && mode === 'login' ? '#fff' : '#000', 
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
                            ? 'AUTHENTICATING...' 
                            : mode === 'login' 
                                ? (roleChoice === 'admin' ? <><ShieldCheck size={18}/> SIGN IN AS ADMIN</> : <><LogIn size={18}/> SIGN IN AS CANDIDATE</>) 
                                : mode === 'register' ? <><UserPlus size={18}/> CREATE ACCOUNT</> 
                                : mode === 'forgot' ? <><Send size={18}/> TRANSMIT OTP</> 
                                : 'CONFIRM OVERRIDE'}
                    </button>
                    
                </form>

                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'center', fontSize: '0.82rem' }}>
                    {mode === 'login' && roleChoice === 'user' && (
                        <>
                            <span style={{ color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('forgot'); setError(''); setMsg(''); }}>Forgot Password?</span>
                            <span style={{ color: 'var(--text-muted)' }}>No candidate clearance? <span style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setMode('register'); setError(''); setMsg(''); }}>Request Access</span></span>
                        </>
                    )}
                    {mode === 'login' && roleChoice === 'admin' && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            Placement Officer credentials are provisioned by the university administration.
                        </div>
                    )}
                    {(mode === 'register' || mode === 'forgot' || mode === 'reset') && (
                        <span style={{ color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('login'); setError(''); setMsg(''); }}>Return to Login</span>
                    )}
                </div>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
};

export default AuthModal;
