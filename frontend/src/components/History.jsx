import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, ExternalLink, Sliders } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authError, setAuthError] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const navigate = useNavigate();

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get('/api/history');
                setHistory(res.data);
            } catch (err) {
                if (err.response?.status === 401) {
                    setAuthError(true);
                } else {
                    setError('Failed to load history');
                }
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) {
        return <div className="text-center mt-8"><h2>Loading history...</h2></div>;
    }

    if (authError) {
        return (
            <div className="card text-center" style={{ padding: '4rem 2rem', border: '1px solid var(--danger)', marginTop: '2rem' }}>
                <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>SECURITY CLEARANCE REQUIRED</h2>
                <p style={{ color: 'var(--text-muted)' }}>Please sign in to access your personal archives.</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-center mt-8 text-danger"><h2>{error}</h2></div>;
    }

    return (
        <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
            <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
                <Clock className="text-primary inline mr-2" /> Past Analyses
            </h1>

            {history.length === 0 ? (
                <div className="card text-center">
                    <p className="text-muted mb-4">You haven't run any resume analyses yet.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>Analyze Resume</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {history.map((item) => {
                        const date = new Date(item.created_at).toLocaleString();
                        let scoreColor = 'var(--danger)';
                        if (item.score >= 75) scoreColor = 'var(--success)';
                        else if (item.score >= 50) scoreColor = 'var(--warning)';

                        return (
                            <div key={item.id} className="card" style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => toggleExpand(item.id)}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Analysis</h3>
                                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>{date}</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                                            {item.missing_skills?.slice(0, 3).map((skill, idx) => (
                                                <span key={idx} style={{ background: 'var(--bg-color)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                                                    {skill}
                                                </span>
                                            ))}
                                            {item.missing_skills?.length > 3 && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>+{item.missing_skills.length - 3} more missing</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 800, color: scoreColor }}>{item.score}%</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Match Score</div>
                                        </div>
                                    </div>
                                </div>

                                {expandedId === item.id && (
                                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
                                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                            <div style={{ flex: '1 1 45%' }}>
                                                <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>// INPUT: RESUME TEXT</h4>
                                                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                                                    {item.resume_text || 'No resume text available for this record.'}
                                                </div>
                                            </div>
                                            <div style={{ flex: '1 1 45%' }}>
                                                <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>// TARGET: JOB DESCRIPTION</h4>
                                                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                                                    {item.job_description || 'No job description available for this record.'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button 
                                                className="btn btn-outline" 
                                                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    localStorage.setItem('latest_analysis', JSON.stringify(item));
                                                    navigate('/optimizer', { state: { result: item } });
                                                }}
                                            >
                                                <Sliders size={14} style={{ marginRight: '0.3rem' }} /> Open in Sandbox Optimizer
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default History;
