import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Briefcase, CheckCircle, XCircle, Award, BookOpen, Search, UserCheck, ShieldAlert, Sparkles, RefreshCw, BarChart2, Lock } from 'lucide-react';
import './PlacementModule.css';

const DJANGO_API_BASE = import.meta.env.VITE_DJANGO_API_BASE || '/api/p06';

const PlacementModule = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const studentId = user ? (user._id || user.id || 'demo_student_101') : 'demo_student_101';

  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'profile' | 'recruiter'
  const [drives, setDrives] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentOverview, setStudentOverview] = useState(null);
  const [selectedDriveEval, setSelectedDriveEval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recruiterCandidates, setRecruiterCandidates] = useState([]);
  const [recruiterLoading, setRecruiterLoading] = useState(false);

  // Load placement overview & drives
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch drives
      const driveRes = await axios.get(`${DJANGO_API_BASE}/drives${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
      setDrives(driveRes.data);

      // 2. Fetch student overview
      const overviewRes = await axios.get(`${DJANGO_API_BASE}/overview/${studentId}`);
      setStudentOverview(overviewRes.data);
    } catch (err) {
      console.error('Error fetching placement data:', err);
      setError(err.response?.data?.error || 'Could not connect to Placement API. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleViewDriveDetails = async (driveId) => {
    try {
      const evalRes = await axios.get(`${DJANGO_API_BASE}/evaluate/${studentId}/${driveId}`);
      setSelectedDriveEval(evalRes.data);
    } catch (err) {
      console.error('Error fetching drive evaluation:', err);
    }
  };

  const fetchRecruiterData = async () => {
    setRecruiterLoading(true);
    try {
      const res = await axios.get(`${DJANGO_API_BASE}/recruiter/students`, {
        headers: {
          'X-Recruiter-ID': 'recruiter_admin_1',
          'X-Recruiter-Email': 'placement_officer@university.edu'
        }
      });
      setRecruiterCandidates(res.data.candidates);
    } catch (err) {
      console.error('Recruiter API error:', err);
    } finally {
      setRecruiterLoading(false);
    }
  };

  return (
    <div className="placement-container animate-fade-in">
      {/* Header Banner */}
      <div className="placement-header">
        <div>
          <h1 className="placement-title">
            <Briefcase size={28} color="var(--primary-color, #6366f1)" />
            Placement Skill Matcher
          </h1>
          <p className="placement-subtitle">
            Compare verified student skills, check eligibility, analyze readiness, and get personalized preparation plans.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="tab-nav">
            <button 
              className={`tab-btn ${activeTab === 'drives' ? 'active' : ''}`}
              onClick={() => setActiveTab('drives')}
            >
              <Briefcase size={16} /> Placement Drives
            </button>
            <button 
              className={`tab-btn ${activeTab === 'recruiter' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('recruiter');
                fetchRecruiterData();
              }}
            >
              <UserCheck size={16} /> Recruiter Portal
            </button>
            <button 
              className="tab-btn"
              onClick={() => navigate('/placement/admin')}
              style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}
              title="Restricted Admin Management Portal"
            >
              <Lock size={15} /> Admin Portal
            </button>
          </div>
          <button onClick={loadData} className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '8px' }} title="Refresh Data">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Student Profile Quick View Bar */}
      {studentOverview?.profile && (
        <div className="profile-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', fontWeight: 600 }}>STUDENT PROFILE</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-color, #f8fafc)' }}>
              {studentOverview.profile.student_name} <span style={{ fontSize: '0.85rem', color: 'var(--primary-color, #6366f1)', fontWeight: 500 }}>({studentOverview.profile.department})</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '0.2rem' }}>
              CGPA: <strong style={{ color: '#10b981' }}>{studentOverview.profile.cgpa}</strong> | Student ID: <code>{studentOverview.profile.student_id}</code>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.3rem' }}>VERIFIED SKILLS</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {Object.entries(studentOverview.profile.skills || {}).map(([skill, prof]) => (
                <span key={skill} className="skill-tag matched">
                  {skill} ({prof}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: PLACEMENT DRIVES */}
      {activeTab === 'drives' && (
        <>
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search drives by company, role, or required skill (PostgreSQL Full-Text Search)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.5rem',
                  background: 'var(--card-bg, #1e293b)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                  borderRadius: '8px',
                  color: 'var(--text-color, #fff)',
                  outline: 'none'
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', borderRadius: '8px' }}>
              Search
            </button>
          </form>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <RefreshCw size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '0.5rem' }}>Analyzing placement drives & student readiness...</p>
            </div>
          ) : (
            <div className="drives-grid">
              {studentOverview?.evaluations?.map((item) => {
                const { drive, eligibility, readiness } = item;
                const isEligible = eligibility?.is_eligible;

                return (
                  <div key={drive.id} className="drive-card">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-color, #f8fafc)' }}>
                            {drive.company_name}
                          </h3>
                          <div style={{ fontSize: '0.85rem', color: 'var(--primary-color, #6366f1)', fontWeight: 600 }}>
                            {drive.role_title}
                          </div>
                        </div>
                        <span className={isEligible ? 'badge-eligible' : 'badge-ineligible'}>
                          {isEligible ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {isEligible ? 'ELIGIBLE' : 'INELIGIBLE'}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '1rem', lineHeight: '1.4' }}>
                        {drive.description}
                      </p>

                      {/* Criteria */}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.75rem' }}>
                        <div>Min CGPA: <strong>{drive.min_cgpa}</strong></div>
                        <div>Departments: <strong>{drive.eligibility_departments.join(', ')}</strong></div>
                      </div>

                      {/* Mandatory Skills */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.3rem' }}>
                          MANDATORY SKILLS
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {drive.mandatory_skills.map((skill) => {
                            const isMatched = readiness?.matched_skills?.some(m => m.name.toLowerCase() === skill.toLowerCase());
                            return (
                              <span key={skill} className={`skill-tag ${isMatched ? 'matched' : 'missing'}`}>
                                {isMatched ? '✓' : '✗'} {skill}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Gap Reasons if Ineligible */}
                      {!isEligible && eligibility?.gap_reasons?.length > 0 && (
                        <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.75rem', color: '#fb7185' }}>
                          <strong>Eligibility Gap:</strong>
                          <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0 }}>
                            {eligibility.gap_reasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Readiness Score Meter */}
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                          <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>Placement Readiness</span>
                          <span style={{ color: readiness?.readiness_score >= 70 ? '#10b981' : '#f59e0b' }}>
                            {readiness?.readiness_score}% Match
                          </span>
                        </div>
                        <div className="readiness-bar-bg">
                          <div 
                            className="readiness-bar-fill"
                            style={{ 
                              width: `${readiness?.readiness_score || 0}%`,
                              background: readiness?.readiness_score >= 70 ? 'linear-gradient(90deg, #6366f1, #10b981)' : 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleViewDriveDetails(drive.id)}
                      className="btn btn-outline"
                      style={{ width: '100%', marginTop: '1.25rem', padding: '0.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <Sparkles size={15} /> View Gap Analysis & Prep Plan
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: RECRUITER PORTAL */}
      {activeTab === 'recruiter' && (
        <div>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '1rem 1.5rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={20} /> Authorised Staff & Recruiter Audit View
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Every access attempt is authenticated, role-checked, and logged to <code>RecruiterAccessLog</code> for audit compliance.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#312e81', color: '#c7d2fe', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #4338ca' }}>
              AUDIT_LOGGED_ACTIVE
            </span>
          </div>

          {recruiterLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading candidate analytics...</div>
          ) : (
            <div>
              <h4 style={{ color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart2 size={18} /> Candidate Readiness Register ({recruiterCandidates.length} Candidates)
              </h4>
              <div style={{ background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)', color: '#94a3b8', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Student ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Dept</th>
                      <th style={{ padding: '0.75rem 1rem' }}>CGPA</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Top Skills</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Evaluations Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recruiterCandidates.map((c) => (
                      <tr key={c.student.student_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}><code>{c.student.student_id}</code></td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#f8fafc' }}>{c.student.student_name}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{c.student.department}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#10b981', fontWeight: 700 }}>{c.student.cgpa}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {Object.keys(c.student.skills || {}).slice(0, 3).join(', ')}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#6366f1', fontWeight: 600 }}>
                          {c.readiness_records.length} Drives Analyzed
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL FOR GAP ANALYSIS & PREPARATION PLAN */}
      {selectedDriveEval && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className={selectedDriveEval.eligibility.is_eligible ? 'badge-eligible' : 'badge-ineligible'}>
                  {selectedDriveEval.eligibility.is_eligible ? 'ELIGIBLE' : 'INELIGIBLE'}
                </span>
                <h2 style={{ margin: '0.5rem 0 0 0', color: '#f8fafc', fontSize: '1.4rem' }}>
                  {selectedDriveEval.drive.company_name} — {selectedDriveEval.drive.role_title}
                </h2>
                <div style={{ color: '#6366f1', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem' }}>
                  Readiness Score: {selectedDriveEval.readiness.readiness_score}% Match
                </div>
              </div>
              <button 
                onClick={() => setSelectedDriveEval(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Gap Analysis Section */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={18} color="#6366f1" /> Skill & Eligibility Gap Analysis
              </h4>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                <div>Mandatory Skills Matched: <strong style={{ color: '#10b981' }}>{selectedDriveEval.readiness.matched_skills.filter(s => s.type === 'mandatory').length} / {selectedDriveEval.drive.mandatory_skills.length}</strong></div>
                {selectedDriveEval.readiness.missing_mandatory_skills.length > 0 && (
                  <div style={{ color: '#fb7185', marginTop: '0.3rem' }}>
                    Missing Mandatory Skills: <strong>{selectedDriveEval.readiness.missing_mandatory_skills.join(', ')}</strong>
                  </div>
                )}
                {selectedDriveEval.readiness.missing_preferred_skills.length > 0 && (
                  <div style={{ color: '#fbbf24', marginTop: '0.3rem' }}>
                    Missing Preferred Skills: <strong>{selectedDriveEval.readiness.missing_preferred_skills.join(', ')}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Preparation Plan */}
            <div>
              <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={18} color="#10b981" /> Recommended Preparation Plan Roadmap
              </h4>
              {selectedDriveEval.preparation_plan?.recommended_steps?.map((step) => (
                <div key={step.step} className="prep-step-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <strong style={{ color: '#818cf8', fontSize: '0.9rem' }}>Step {step.step}: {step.title}</strong>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {step.priority} ({step.target_days} Days)
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>{step.description}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
              <button onClick={() => setSelectedDriveEval(null)} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}>
                Close Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementModule;
