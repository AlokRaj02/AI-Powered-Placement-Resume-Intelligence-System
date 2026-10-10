import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(() => {
        const storedEmail = localStorage.getItem('userEmail');
        const storedRole = localStorage.getItem('userRole') || (storedEmail === 'admin@placement.edu' ? 'admin' : 'user');
        const storedName = localStorage.getItem('userName') || '';
        return storedEmail ? { email: storedEmail, role: storedRole, username: storedName } : null;
    });

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const storedEmail = localStorage.getItem('userEmail');
            const storedRole = localStorage.getItem('userRole') || (storedEmail === 'admin@placement.edu' ? 'admin' : 'user');
            const storedName = localStorage.getItem('userName') || '';
            if (storedEmail) {
                setUser({ email: storedEmail, role: storedRole, username: storedName });
                if (storedRole === 'admin') {
                    localStorage.setItem('placement_admin_token', token);
                    localStorage.setItem('placement_admin_user', JSON.stringify({ email: storedEmail, role: 'admin', name: storedName || 'Placement Admin' }));
                }
            }
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            localStorage.removeItem('placement_admin_token');
            localStorage.removeItem('placement_admin_user');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
    }, [token]);

    const login = (jwtToken, email, role = 'user', username = '') => {
        const effectiveRole = role === 'admin' || email.toLowerCase() === 'admin@placement.edu' ? 'admin' : 'user';
        setToken(jwtToken);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', effectiveRole);
        localStorage.setItem('userName', username || '');
        
        if (effectiveRole === 'admin') {
            localStorage.setItem('placement_admin_token', jwtToken);
            localStorage.setItem('placement_admin_user', JSON.stringify({ email, role: 'admin', name: username || 'Placement Admin' }));
        }

        setUser({ email, role: effectiveRole, username: username || '' });
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAdmin: user?.role === 'admin' }}>
            {children}
        </AuthContext.Provider>
    );
};
