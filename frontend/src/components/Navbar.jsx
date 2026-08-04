import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileSearch, Clock, Home, BookOpen, User, LogOut, Sliders, Palette, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import AuthModal from './auth/AuthModal';

const Navbar = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useContext(AuthContext);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setIsThemeOpen(false);
    if (isThemeOpen) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isThemeOpen]);

  const themeDetails = {
    'saas-dark': { label: 'SaaS Dark', color: '#6366f1', icon: '🌙' },
    'saas-light': { label: 'SaaS Light', color: '#4f46e5', icon: '☀️' },
    'cyber-neon': { label: 'Cyber Neon', color: '#00f3ff', icon: '💻' },
    'aurora-sunset': { label: 'Aurora Sunset', color: '#ff2a85', icon: '🌌' },
    'matrix-green': { label: 'Matrix Hacker', color: '#00ff41', icon: '📟' },
    'solar-flares': { label: 'Solar Flares', color: '#ffb300', icon: '☀️' },
    'ice-crystal': { label: 'Ice Crystal', color: '#00a8ff', icon: '❄️' }
  };

  return (
    <>
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <FileSearch size={24} />
        <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Resume AI</span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--success-light)' }} className="hide-on-mobile">
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div>
          <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 600, letterSpacing: '0.5px' }}>SYS_ONLINE</span>
        </div>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        
        <div className="navbar-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Home size={16} /> HUB
            </span>
          </Link>
          <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={16} /> ARCHIVE
            </span>
          </Link>
          <Link to="/docs" className={`nav-link ${location.pathname === '/docs' ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <BookOpen size={16} /> DOCS
            </span>
          </Link>
          <Link to="/optimizer" className={`nav-link ${location.pathname === '/optimizer' ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sliders size={16} /> OPTIMIZER
            </span>
          </Link>
        </div>

        {/* Custom Dropdown Theme Picker */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsThemeOpen(!isThemeOpen);
            }}
            className="btn btn-outline"
            style={{ 
              padding: '0.4rem 0.8rem', 
              borderRadius: 'var(--radius-md)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              height: '36px',
              fontSize: '0.85rem'
            }}
          >
            <Palette size={16} color="var(--primary-color)" />
            <span className="hide-on-mobile" style={{ textTransform: 'capitalize' }}>
              {themeDetails[theme]?.label || theme}
            </span>
            <ChevronDown size={14} style={{ transform: isThemeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {isThemeOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                zIndex: 1000,
                width: '180px',
                padding: '0.5rem 0',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
              className="animate-fade-in"
            >
              {Object.keys(themeDetails).map(key => (
                <button
                  key={key}
                  onClick={() => {
                    setTheme(key);
                    setIsThemeOpen(false);
                  }}
                  style={{
                    background: theme === key ? 'var(--primary-light)' : 'transparent',
                    border: 'none',
                    color: 'var(--text-color)',
                    padding: '0.5rem 1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-secondary)',
                    width: '100%',
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => {
                    if (theme !== key) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (theme !== key) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{themeDetails[key].icon}</span>
                    <span>{themeDetails[key].label}</span>
                  </span>
                  <div 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: themeDetails[key].color,
                      boxShadow: `0 0 6px ${themeDetails[key].color}`
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.6rem', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-sm)', background: 'var(--success-light)' }} className="hide-on-mobile">
                <User size={14} color="var(--success)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 500, maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</span>
              </div>
              <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-md)', background: 'var(--danger-light)', color: 'var(--danger)', cursor: 'pointer', outline: 'none', fontSize: '0.75rem', fontWeight: 600 }}>
                <LogOut size={14} /> <span className="hide-on-mobile">LOGOUT</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => openAuth('login')} style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-md)', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, outline: 'none' }}>
                <User size={12} /> LOGIN
              </button>
              <button onClick={() => openAuth('register')} style={{ background: 'var(--primary-color)', border: '1px solid transparent', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, outline: 'none' }}>
                REGISTER
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
    <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialMode={authMode} />
    <style dangerouslySetInnerHTML={{__html: `
      @media (max-width: 768px) {
        .hide-on-mobile { display: none !important; }
        .navbar-nav { gap: 0.75rem; }
        .nav-link span { font-size: 0.8rem; }
      }
    `}} />
    </>
  );
};

export default Navbar;
