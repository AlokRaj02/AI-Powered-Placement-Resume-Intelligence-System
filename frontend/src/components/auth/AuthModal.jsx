import React, { useState, useContext, useEffect } from 'react';
import { X, Mail, Lock, UserPlus, Key, LogIn, Send, User as UserIcon, Phone, Calendar } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    const { login } = useContext(AuthContext);
    const [mode, setMode] = useState(initialMode); // login | register | forgot | reset
    
    useEffect(() => {
        if (isOpen) setMode(initialMode);
    }, [isOpen, initialMode]);
    
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

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setMsg(''); setLoading(true);
        try {
            if (mode === 'login') {
                const res = await axios.post('/api/auth/login', { email, password });
                login(res.data.token, res.data.email, res.data.role, res.data.username);
                onClose();
            } else if (mode === 'register') {
                const res = await axios.post('/api/auth/register', { username, email, dob, password, phone_number: phone });
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.7)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', animation: 'fadeIn 0.3s ease-out' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'var(--transition)' }}><X size={24} /></button>
                
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
                    {mode === 'login' ? 'SYSTEM LOGIN' : mode === 'register' ? 'NEW CLEARANCE' : mode === 'forgot' ? 'RESET OVERRIDE' : 'VERIFY OTP'}
                </h2>

                {error && <div style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>⚠️ {error}</div>}
                {msg && <div style={{ color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>✅ {msg}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {mode === 'register' && (
                        <>
                            <div style={{ position: 'relative' }}>
                                <UserIcon size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="Full Name" required value={username} onChange={e=>setUsername(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none' }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="date" required value={dob} onChange={e=>setDob(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none', colorScheme: 'dark' }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="tel" placeholder="Phone Number" required value={phone} onChange={e=>setPhone(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none' }} />
                            </div>
                        </>
                    )}

                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="email" placeholder="Email Address" required value={email} onChange={e=>setEmail(e.target.value)} disabled={mode==='reset'} style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none' }} />
                    </div>

                    {(mode === 'login' || mode === 'register') && (
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="password" placeholder="Password" required value={password} onChange={e=>setPassword(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none' }} />
                        </div>
                    )}

                    {mode === 'reset' && (
                        <>
                            <div style={{ position: 'relative' }}>
                                <Key size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="6-Digit OTP" required value={otp} onChange={e=>setOtp(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none' }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="password" placeholder="New Password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none' }} />
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.8rem', background: 'var(--primary-color)', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'PROCESSING...' : mode === 'login' ? <><LogIn size={18}/> AUTHENTICATE</> : mode === 'register' ? <><UserPlus size={18}/> CREATE ACCESS</> : mode === 'forgot' ? <><Send size={18}/> TRANSMIT OTP</> : 'CONFIRM OVERRIDE'}
                    </button>
                    
                </form>

                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                    {mode === 'login' && (
                        <>
                            <span style={{ color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('forgot'); setError(''); setMsg(''); }}>Forgot Password?</span>
                            <span style={{ color: 'var(--text-muted)' }}>No clearance? <span style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setMode('register'); setError(''); setMsg(''); }}>Request Access</span></span>
                            <div style={{ marginTop: '0.4rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', color: '#818cf8' }}>
                                🛡️ Placement Admin? Sign in with <code>admin@placement.edu</code>
                            </div>
                        </>
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
