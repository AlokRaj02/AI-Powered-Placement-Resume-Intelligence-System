import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Sliders, Cpu, CheckCircle, AlertCircle, Copy, Download, 
  Sparkles, RefreshCw, Terminal, ChevronRight, HelpCircle, FileText 
} from 'lucide-react';
import axios from 'axios';

const Optimizer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  // States
  const [result, setResult] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rescanError, setRescanError] = useState('');
  
  const [activeSkillSuggestions, setActiveSkillSuggestions] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [showJobDesc, setShowJobDesc] = useState(false);

  // Load initial state
  useEffect(() => {
    const initialResult = location.state?.result || JSON.parse(localStorage.getItem('latest_analysis') || 'null');
    if (initialResult) {
      setResult(initialResult);
      setEditedText(initialResult.resume_text || '');
      setJobDescription(initialResult.job_description || '');
    }
  }, [location]);

  // Show Toast helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  if (!result) {
    return (
      <div className="card text-center" style={{ padding: '4rem 2rem', border: '1px dashed var(--border-color)', marginTop: '2rem' }}>
        <AlertCircle size={48} className="text-warning" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
        <h2 style={{ color: 'var(--warning)', fontFamily: 'var(--font-primary)', marginBottom: '1rem' }}>NO ACTIVE RESUME SESSION</h2>
        <p className="text-muted" style={{ maxWidth: '500px', margin: '0 auto 2rem' }}>
          Please go to the Hub, upload your resume, and run the initial scan before opening the Optimizer Sandbox.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          GO TO HUB
        </button>
      </div>
    );
  }

  const { score, missing_skills, feedback, skills_breakdown } = result;

  // Handle Quick Rescan
  const handleRescan = async () => {
    if (!editedText || !jobDescription) {
      return setRescanError('Both resume text and job description are required for rescanning.');
    }
    setIsAnalyzing(true);
    setRescanError('');

    try {
      const response = await axios.post('/api/analyze', {
        resume_text: editedText,
        job_description: jobDescription
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setResult(response.data);
      localStorage.setItem('latest_analysis', JSON.stringify(response.data));
      triggerToast('Scan completed! Match metrics updated.');
    } catch (err) {
      setRescanError(err.response?.data?.error || 'Quick scan failed. Connection offline.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate bullet suggestions for a missing skill
  const fetchSuggestions = async (skill) => {
    if (activeSkillSuggestions === skill) {
      // Toggle accordion closed
      setActiveSkillSuggestions('');
      return;
    }

    setActiveSkillSuggestions(skill);
    setSuggestions([]);
    setLoadingSuggestions(true);
    setSuggestionError('');

    try {
      const response = await axios.post('/api/optimize/suggest', {
        resume_text: editedText,
        job_description: jobDescription,
        missing_skill: skill
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSuggestions(response.data.bullet_points || []);
    } catch (err) {
      setSuggestionError(err.response?.data?.error || 'Failed to generate recommendations.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Insert bullet point at text cursor position
  const handleInsertSuggestion = (bulletText) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentText = editedText;

    const insertion = `\n- ${bulletText}\n`;
    const newText = currentText.substring(0, startPos) + insertion + currentText.substring(endPos);
    setEditedText(newText);

    triggerToast('Injected bullet point into editor.');

    // Refocus and place cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + insertion.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Copy updated text
  const handleCopyText = () => {
    navigator.clipboard.writeText(editedText);
    triggerToast('Resume content copied to clipboard.');
  };

  // Export as file
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([editedText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "optimized-resume.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    triggerToast('Downloaded optimized text file.');
  };

  // Toggle checklist item
  const toggleCheckedItem = (index) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  // Circular progress math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  let scoreColor = 'var(--danger)';
  if (score >= 75) scoreColor = 'var(--success)';
  else if (score >= 50) scoreColor = 'var(--warning)';

  return (
    <div className="optimizer-container animate-fade-in" style={{ paddingBottom: '4rem', marginTop: '1rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} /> BACK TO DASHBOARD
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
          <Sliders size={22} />
          <span style={{ fontFamily: 'var(--font-primary)', letterSpacing: '1px', fontWeight: 'bold', textTransform: 'uppercase' }}>ATS Sandbox Optimizer</span>
        </div>
      </div>

      {/* Main Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        
        {/* LEFT COLUMN: RESUME EDITOR */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '650px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={18} /> // EDIT_BUFFER: RESUME_TEXT
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Words: {editedText.split(/\s+/).filter(Boolean).length} | Characters: {editedText.length}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className="form-control"
            style={{ 
              flex: 1, 
              width: '100%', 
              fontFamily: 'monospace', 
              fontSize: '0.9rem', 
              lineHeight: '1.5',
              resize: 'none',
              background: 'rgba(0,0,0,0.08)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              color: 'var(--text-color)',
              marginBottom: '1rem'
            }}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="Paste or edit your CV text here..."
          />

          {rescanError && (
            <div style={{ background: 'var(--danger-light)', border: '1px solid rgba(244,63,94,0.2)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              ⚠️ ERROR: {rescanError}
            </div>
          )}

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: '2 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
              onClick={handleRescan} 
              disabled={isAnalyzing}
            >
              <RefreshCw size={16} className={isAnalyzing ? "spin" : ""} style={{ animation: isAnalyzing ? 'spin 1s linear infinite' : 'none' }} />
              {isAnalyzing ? 'RUNNING RESCAN...' : 'RECALCULATE SCORE'}
            </button>
            
            <button 
              className="btn btn-outline" 
              style={{ flex: '1 1 auto', padding: '0.75rem 1rem' }} 
              onClick={handleCopyText} 
              title="Copy Text"
            >
              <Copy size={16} /> <span className="hide-on-mobile">COPY</span>
            </button>

            <button 
              className="btn btn-outline" 
              style={{ flex: '1 1 auto', padding: '0.75rem 1rem' }} 
              onClick={handleDownload} 
              title="Download Text"
            >
              <Download size={16} /> <span className="hide-on-mobile">DOWNLOAD</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROL PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 1. Interactive Match Score Card */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.5rem' }}>
            
            <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--border-color)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r={radius}
                  fill="transparent"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s ease-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: scoreColor }}>{score}%</span>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={16} /> MATCH OPTIMIZATION MATRIX
              </h4>
              <p className="text-muted" style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem' }}>
                Your CV match index is calculated dynamically. Aim to pass the standard recruiter filter of <b>80%</b> to qualify.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, height: '4px', background: 'var(--border-color)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, score)}%`, background: scoreColor, borderRadius: '2px', transition: 'width 1s ease-out' }}></div>
                </div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-primary)' }}>TARGET: 80%</span>
              </div>
            </div>

          </div>

          {/* 2. Interactive Skills Gap Injector */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <Sparkles size={18} className="text-warning" /> IDENTIFIED GAPS & AI INJECTOR
            </h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Select a missing competency keyword to call Gemini AI. We will generate tailored bullet points that you can insert at your cursor.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {missing_skills && missing_skills.length > 0 ? (
                missing_skills.map((skill, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', background: 'rgba(0,0,0,0.1)' }}>
                    
                    {/* Header trigger */}
                    <div 
                      onClick={() => fetchSuggestions(skill)}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.75rem 1rem', 
                        cursor: 'pointer',
                        background: activeSkillSuggestions === skill ? 'var(--primary-light)' : 'transparent',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }}></span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{skill}</span>
                      </div>
                      <button 
                        className="btn btn-outline" 
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        {activeSkillSuggestions === skill ? 'COLLAPSE' : 'GENERATE SUGGESTIONS'}
                        <ChevronRight size={10} style={{ transform: activeSkillSuggestions === skill ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
                      </button>
                    </div>

                    {/* Suggestions Content */}
                    {activeSkillSuggestions === skill && (
                      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }} className="animate-fade-in">
                        
                        {loadingSuggestions ? (
                          <div style={{ padding: '1rem 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary-color)' }}>
                            <RefreshCw size={16} className="spin" style={{ display: 'inline-block', marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                            ANALYZING BACKGROUND & GENERATING STATEMENTS...
                          </div>
                        ) : suggestionError ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                            ⚠️ {suggestionError}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                              Click any generated statement below to insert it at your cursor location in the editor:
                            </div>
                            {suggestions.map((bullet, bIdx) => (
                              <div 
                                key={bIdx}
                                onClick={() => handleInsertSuggestion(bullet)}
                                style={{ 
                                  background: 'rgba(0, 0, 0, 0.05)', 
                                  border: '1px dashed var(--border-color)', 
                                  padding: '0.75rem', 
                                  borderRadius: 'var(--radius-md)',
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  color: '#e5e7eb',
                                  textAlign: 'left'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'var(--primary-light)';
                                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                                  e.currentTarget.style.borderColor = 'var(--border-color)';
                                }}
                              >
                                {bullet}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)' }}>
                  <CheckCircle size={28} className="text-success" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>0 CORE GAPS IDENTIFIED</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Excellent! Your CV captures all critical job spec parameters.</div>
                </div>
              )}
            </div>

          </div>

          {/* 3. Suggestions & Checklist */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <CheckCircle size={18} className="text-success" /> OPTIMIZATION ACTION STEPS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {feedback?.suggestions && feedback.suggestions.length > 0 ? (
                feedback.suggestions.map((sug, idx) => (
                  <div 
                    key={idx}
                    onClick={() => toggleCheckedItem(idx)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.75rem', 
                      padding: '0.6rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: checkedItems.has(idx) ? 'var(--success-light)' : 'transparent',
                      opacity: checkedItems.has(idx) ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={checkedItems.has(idx)}
                      onChange={() => {}} // handled by parent div click
                      style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.85rem', textDecoration: checkedItems.has(idx) ? 'line-through' : 'none' }}>
                      {sug}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No optimization suggestions available.
                </div>
              )}
            </div>
          </div>

          {/* 4. Collapsible Job Description Reference */}
          <div className="card" style={{ padding: '1rem 1.5rem' }}>
            <div 
              onClick={() => setShowJobDesc(!showJobDesc)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)' }}>
                <FileText size={16} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--font-primary)' }}>TARGET JOB SPEC PARAMETERS</span>
              </div>
              <ChevronRight size={16} style={{ transform: showJobDesc ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
            </div>

            {showJobDesc && (
              <div 
                style={{ 
                  marginTop: '1rem', 
                  maxHeight: '150px', 
                  overflowY: 'auto', 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '0.75rem', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid var(--border-color)'
                }}
                className="animate-fade-in"
              >
                {jobDescription}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Floating System Notification / Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          color: 'var(--text-color)',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          zIndex: 99999,
          fontFamily: 'var(--font-secondary)',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }} className="animate-fade-in">
          <Cpu size={16} className="text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CSS Spin Keyframes utility */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

    </div>
  );
};

export default Optimizer;
