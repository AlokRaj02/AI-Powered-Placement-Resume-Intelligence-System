import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, Briefcase, Loader2, Sparkles, Target, Award, Shield } from 'lucide-react';
import axios from 'axios';
import ParticleNetwork from './animations/ParticleNetwork';
import GridBackground from './animations/GridBackground';
import { useTheme } from '../context/ThemeContext';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleFileSelection(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) handleFileSelection(e.target.files[0]);
  };

  const handleFileSelection = (selectedFile) => {
    if (selectedFile.type.includes('pdf') || selectedFile.type.includes('word') || selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.pdf')) {
      setFile(selectedFile); setError('');
    } else {
      setError('Please upload a PDF or DOCX resume.'); setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !jobDescription) return setError('Both resume and job description are required.');
    setIsAnalyzing(true); setError('');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jobDescription);

    try {
      const response = await axios.post('/api/analyze', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      localStorage.setItem('latest_analysis', JSON.stringify(response.data));
      navigate('/dashboard', { state: { result: response.data } });
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Connection offline.');
    } finally { setIsAnalyzing(false); }
  };

  const { theme } = useTheme();
  const isCyberTheme = ['cyber-neon', 'aurora-sunset', 'matrix-green', 'solar-flares'].includes(theme);

  return (
    <div className="page-wrapper" style={{ minHeight: 'auto' }}>
      {isCyberTheme && (
        <>
          <ParticleNetwork />
          <GridBackground />
          <div className="scanline-overlay"></div>
        </>
      )}
      
      {/* Hero Section */}
      <div className="text-center" style={{ maxWidth: '800px', margin: '3rem auto 4rem auto', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem', border: '1px solid rgba(99,102,241,0.15)' }}>
          <Sparkles size={14} /> Next-Gen Semantic ATS Matching
        </div>
        
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 1.25rem 0', lineHeight: '1.15' }}>
          Evaluate Your Resume Against <span style={{ background: 'linear-gradient(to right, var(--primary-color), #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Target Roles</span> Instantly
        </h1>
        
        <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Upload your CV and specify the job criteria. Our AI scoring engine evaluates alignment probability and generates actionable optimization steps.
        </p>
      </div>

      {/* Main Grid: Upload resume + paste job description */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* Resume upload Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '340px' }}>
          <div>
            <h2 className="card-title" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
              <FileText size={20} className="text-primary" /> Candidate Resume
            </h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>
              Upload your latest curriculum vitae in PDF or Word format.
            </p>
          </div>
          
          <div 
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--primary-color)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)', padding: '2.5rem 1.5rem', textAlign: 'center',
              cursor: 'pointer', background: isDragging ? 'var(--primary-light)' : 'rgba(0,0,0,0.05)',
              transition: 'var(--transition)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx" hidden />
            {file ? (
              <div>
                <FileText size={42} className="text-success" style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>{file.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{(file.size/1024/1024).toFixed(2)} MB</div>
              </div>
            ) : (
              <div>
                <UploadCloud size={42} className="text-muted" style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>Drag & Drop file here</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports PDF, DOCX (Max 5MB)</div>
              </div>
            )}
          </div>
        </div>

        {/* Job Description Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
          <div>
            <h2 className="card-title" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
              <Briefcase size={20} className="text-primary" /> Target Specification
            </h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>
              Paste the target job description or core competency criteria.
            </p>
          </div>
          <textarea
            className="form-control"
            style={{ flex: 1, resize: 'none', minHeight: '150px', background: 'rgba(0,0,0,0.05)' }}
            placeholder="Requirements, responsibilities, or key technology skills required for the position..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-light)', border: '1px solid rgba(244, 63, 94, 0.2)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '3rem', textAlign: 'center', fontWeight: 500, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Submit Button wrapper */}
      <div className="text-center" style={{ marginBottom: '5rem' }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.85rem 3rem', fontSize: '1.05rem', minWidth: '240px' }} 
          onClick={handleSubmit} 
          disabled={!file || !jobDescription || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="spin" size={18} />
              ANALYZING DRAFT...
            </>
          ) : (
            <>
              <Target size={18} />
              Analyze Alignment
            </>
          )}
        </button>
      </div>

      {/* Beautiful Features section */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '4rem', paddingBottom: '4rem' }}>
        <h3 className="text-center" style={{ marginBottom: '3rem', fontSize: '1.75rem', fontWeight: 800 }}>Engine Capabilities</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          
          <div className="card" style={{ padding: '1.5rem' }}>
            <Target size={24} className="text-primary" style={{ marginBottom: '1rem' }} />
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Semantic Match Engine</h4>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Calculates keyword relevance, skill alignment, and domain context match probabilities rather than simple text string matches.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <Award size={24} className="text-primary" style={{ marginBottom: '1rem' }} />
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>SaaS Sandbox Optimizer</h4>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Provides a split-pane interactive workspace to edit resume text directly, generate custom bullet points, and check score changes.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <Shield size={24} className="text-primary" style={{ marginBottom: '1rem' }} />
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Bypass ATS Filters</h4>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Evaluates formatting issues, missing core capabilities, and structure standards to maximize chances of reaching recruiters.
            </p>
          </div>

        </div>
      </div>

      {/* CSS Utility spinner */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

    </div>
  );
};

export default UploadForm;
