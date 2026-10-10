import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ShieldAlert, Lock, Plus, Edit3, Trash2, CheckCircle, 
  XCircle, UserCheck, RefreshCw, ArrowLeft, LogOut, Search, Award, 
  Filter, Calendar, Building, DollarSign, AlertCircle, FileText, User,
  Database, Users, Key, Briefcase
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import './PlacementModule.css';

const API_BASE = import.meta.env.VITE_DJANGO_API_BASE || '/api/p06';

const PlacementAdmin = () => {
  const navigate = useNavigate();
  const { user, token, logout, isAdmin } = useContext(AuthContext);

  // Effective Admin Token from global site session
  const effectiveToken = token || localStorage.getItem('token') || localStorage.getItem('placement_admin_token') || '';
  const isUserAdmin = isAdmin || user?.role === 'admin' || user?.email?.toLowerCase() === 'admin@placement.edu';

  // Active Admin Tab: 'drives' | 'students'
  const [adminTab, setAdminTab] = useState('drives');

  // Drives State
  const [drives, setDrives] = useState([]);
  const [drivesLoading, setDrivesLoading] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Student Oversight State
  const [studentsData, setStudentsData] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedDriveFilter, setSelectedDriveFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Drive Edit/Add Modal State
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingDriveId, setEditingDriveId] = useState(null);
  const [driveFormData, setDriveFormData] = useState({
    company_name: '',
    role_title: '',
    description: '',
    package_lpa: '14.0',
    min_cgpa: '7.5',
    drive_date: new Date().toISOString().split('T')[0],
    eligibility_departments: 'Computer Science, Information Technology',
    mandatory_skills: 'Java, SQL, Problem Solving',
    preferred_skills: 'Docker, AWS'
  });
  const [modalError, setModalError] = useState('');

  // Toast feedback
  const [toast, setToast] = useState('');
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Administrator Directory State (Dedicated MongoDB 'admins' collection)
  const [adminsList, setAdminsList] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    username: '',
    email: '',
    password: '',
    designation: 'Placement Coordinator',
    department: 'Training & Placement Cell',
    phone_number: '+91-9876543210'
  });
  const [adminModalError, setAdminModalError] = useState('');

  // Helper axios with admin auth header
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${effectiveToken}` }
  });

  // Fetch Drives (Admin view - includes all statuses)
  const fetchAdminDrives = async () => {
    if (!effectiveToken || !isUserAdmin) return;
    setDrivesLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/drives`, getAuthHeaders());
      setDrives(res.data);
    } catch (err) {
      console.error('Failed to fetch admin drives:', err);
    } finally {
      setDrivesLoading(false);
    }
  };

  // Fetch Students (Admin oversight)
  const fetchAdminStudents = async () => {
    if (!effectiveToken || !isUserAdmin) return;
    setStudentsLoading(true);
    try {
      const url = selectedDriveFilter 
        ? `${API_BASE}/admin/students?drive_id=${selectedDriveFilter}`
        : `${API_BASE}/admin/students`;
      const res = await axios.get(url, getAuthHeaders());
      setStudentsData(res.data.students || []);
    } catch (err) {
      console.error('Failed to fetch admin students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch Admins List (from dedicated MongoDB 'admins' collection)
  const fetchAdminsList = async () => {
    if (!effectiveToken || !isUserAdmin) return;
    setAdminsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/admins-list`, getAuthHeaders());
      setAdminsList(res.data.admins || []);
    } catch (err) {
      console.error('Failed to fetch admins list:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  // Create New Admin in MongoDB
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminModalError('');
    if (!adminFormData.username || !adminFormData.email || !adminFormData.password) {
      return setAdminModalError('Name, email, and password are required.');
    }
    try {
      await axios.post(`${API_BASE}/admin/create-admin`, adminFormData, getAuthHeaders());
      showToast(`Admin account ${adminFormData.email} created in MongoDB!`);
      setIsAdminModalOpen(false);
      setAdminFormData({
        username: '',
        email: '',
        password: '',
        designation: 'Placement Coordinator',
        department: 'Training & Placement Cell',
        phone_number: '+91-9876543210'
      });
      fetchAdminsList();
    } catch (err) {
      setAdminModalError(err.response?.data?.error || 'Failed to create administrator.');
    }
  };

  useEffect(() => {
    if (isUserAdmin) {
      if (adminTab === 'drives') {
        fetchAdminDrives();
      } else if (adminTab === 'students') {
        fetchAdminStudents();
      } else if (adminTab === 'admins') {
        fetchAdminsList();
      } else if (adminTab === 'analytics') {
        fetchAdminsList();
        fetchAdminDrives();
        fetchAdminStudents();
      }
    }
  }, [isUserAdmin, adminTab, selectedDriveFilter, effectiveToken]);

  // Approve / Reject Drive
  const handleToggleDriveStatus = async (driveId, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/admin/drives/${driveId}/status`,
        { approval_status: newStatus },
        getAuthHeaders()
      );
      showToast(`Drive #${driveId} set to ${newStatus}`);
      fetchAdminDrives();
    } catch (err) {
      showToast('Failed to update drive status.');
    }
  };

  // Delete Drive
  const handleDeleteDrive = async (driveId, company) => {
    if (!window.confirm(`Are you sure you want to permanently delete the ${company} recruitment drive?`)) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/admin/drives/${driveId}`, getAuthHeaders());
      showToast(`Drive for ${company} deleted.`);
      fetchAdminDrives();
    } catch (err) {
      showToast('Failed to delete drive.');
    }
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingDriveId(null);
    setDriveFormData({
      company_name: '',
      role_title: '',
      description: '',
      package_lpa: '14.0',
      min_cgpa: '7.5',
      drive_date: new Date().toISOString().split('T')[0],
      eligibility_departments: 'Computer Science, Information Technology',
      mandatory_skills: 'Java, SQL, Problem Solving',
      preferred_skills: 'Docker, AWS'
    });
    setModalError('');
    setIsDriveModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (drive) => {
    setModalMode('edit');
    setEditingDriveId(drive.id);
    setDriveFormData({
      company_name: drive.company_name,
      role_title: drive.role_title,
      description: drive.description,
      package_lpa: drive.package_lpa.toString(),
      min_cgpa: drive.min_cgpa.toString(),
      drive_date: drive.drive_date,
      eligibility_departments: drive.eligibility_departments.join(', '),
      mandatory_skills: drive.mandatory_skills.join(', '),
      preferred_skills: drive.preferred_skills.join(', ')
    });
    setModalError('');
    setIsDriveModalOpen(true);
  };

  // Save Add/Edit Drive
  const handleSaveDrive = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!driveFormData.company_name || !driveFormData.role_title || !driveFormData.min_cgpa) {
      return setModalError('Company name, role title, and minimum CGPA are required.');
    }

    try {
      if (modalMode === 'add') {
        await axios.post(`${API_BASE}/admin/drives`, driveFormData, getAuthHeaders());
        showToast('New recruitment drive created successfully!');
      } else {
        await axios.put(`${API_BASE}/admin/drives/${editingDriveId}`, driveFormData, getAuthHeaders());
        showToast('Recruitment drive updated successfully!');
      }
      setIsDriveModalOpen(false);
      fetchAdminDrives();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to save drive details.');
    }
  };

  // Override Student Eligibility (Approve / Reject / Reset)
  const handleOverrideEligibility = async (studentId, driveId, actionStatus) => {
    let remarks = '';
    if (actionStatus === 'APPROVED') {
      remarks = window.prompt('Enter approval justification/waiver notes (optional):', 'Approved by Placement Officer waiver.') || 'Approved by Placement Officer.';
    } else if (actionStatus === 'REJECTED') {
      remarks = window.prompt('Enter reason for administrative rejection:', 'Disciplinary criteria violation or low attendance.') || 'Administrative hold.';
    }

    try {
      await axios.patch(
        `${API_BASE}/admin/students/${studentId}/eligibility`,
        { driveId, status: actionStatus, remarks },
        getAuthHeaders()
      );
      showToast(`Student ${studentId} marked as ${actionStatus}`);
      fetchAdminStudents();
    } catch (err) {
      showToast('Failed to update student eligibility.');
    }
  };

  // Filtered Drives
  const filteredDrives = drives.filter(d => {
    const matchesSearch = 
      d.company_name.toLowerCase().includes(driveSearch.toLowerCase()) ||
      d.role_title.toLowerCase().includes(driveSearch.toLowerCase()) ||
      d.mandatory_skills.some(s => s.toLowerCase().includes(driveSearch.toLowerCase()));
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'APPROVED') return matchesSearch && d.approval_status === 'APPROVED';
    if (statusFilter === 'REJECTED') return matchesSearch && d.approval_status === 'REJECTED';
    return matchesSearch;
  });

  // Filtered Students
  const filteredStudents = studentsData.filter(s => {
    const q = studentSearch.toLowerCase();
    return (
      s.profile.student_name.toLowerCase().includes(q) ||
      s.profile.student_id.toLowerCase().includes(q) ||
      s.profile.department.toLowerCase().includes(q)
    );
  });

  // ==========================================
  // VIEW: IF USER IS NOT LOGGED IN AS ADMIN
  // ==========================================
  if (!user) {
    return (
      <div style={{ maxWidth: '520px', margin: '4rem auto', padding: '1rem' }} className="animate-fade-in">
        <div className="card text-center" style={{ padding: '3rem 2rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Lock size={32} color="#818cf8" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            Admin Access Required
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Please sign in to the website using your administrator credentials via the <strong>LOGIN</strong> button in the top navigation bar.
          </p>

          <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#c7d2fe', textAlign: 'left' }}>
            <div style={{ fontWeight: 600, color: '#818cf8', marginBottom: '0.2rem' }}>🔑 Admin Login Credentials:</div>
            <div>Email: <code>admin@placement.edu</code></div>
            <div>Password: <code>admin123</code></div>
            <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Enter these in the top-right <strong>LOGIN</strong> modal on any page.
            </div>
          </div>

          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', fontWeight: 700 }}
          >
            Go to Home & Open Login
          </button>
        </div>
      </div>
    );
  }

  // If user is logged in as a normal student (non-admin)
  if (!isUserAdmin) {
    return (
      <div style={{ maxWidth: '520px', margin: '4rem auto', padding: '1rem' }} className="animate-fade-in">
        <div className="card text-center" style={{ padding: '3rem 2rem', borderRadius: '16px', border: '1px solid rgba(244, 63, 94, 0.3)', background: 'var(--card-bg)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShieldAlert size={32} color="#f43f5e" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e', marginBottom: '0.6rem' }}>
            Candidate Account Restricted
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            You are currently signed in as candidate: <strong style={{ color: 'var(--text-color)' }}>{user.email}</strong>.
          </p>
          <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
            Recruitment drive approvals, edits, and student eligibility overrides are strictly reserved for Placement Officers. Please log out and sign in with an Administrator account.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/placement')} 
              className="btn btn-outline"
              style={{ padding: '0.7rem 1.25rem', borderRadius: '8px' }}
            >
              <ArrowLeft size={16} /> Return to Placement
            </button>
            <button 
              onClick={() => {
                logout();
                navigate('/');
              }} 
              className="btn"
              style={{ background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f43f5e', padding: '0.7rem 1.25rem', borderRadius: '8px', fontWeight: 700 }}
            >
              <LogOut size={16} /> Logout Candidate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: FULL ADMIN MANAGEMENT CONSOLE (For Admin)
  // ==========================================
  return (
    <div className="placement-container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* Toast Alert */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#312e81', border: '1px solid #6366f1', color: '#e0e7ff', padding: '0.85rem 1.25rem', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }} className="animate-fade-in">
          <CheckCircle size={18} color="#818cf8" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ background: '#4338ca', color: '#e0e7ff', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', letterSpacing: '0.5px' }}>
              SITE SUPER ADMIN
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Logged in via main site as: <strong style={{ color: '#818cf8' }}>{user.email}</strong>
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.3rem 0 0 0', color: 'var(--text-color)' }}>
            Placement Drive & Student Oversight
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/placement')} 
            className="btn btn-outline"
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Student View
          </button>
          <button 
            onClick={logout} 
            className="btn"
            style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            <LogOut size={16} /> Logout Admin
          </button>
        </div>
      </div>

      {/* Stat Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL DRIVES</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1', marginTop: '0.2rem' }}>
            {drives.length}
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE & APPROVED</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
            {drives.filter(d => d.approval_status === 'APPROVED' && d.is_active).length}
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>REJECTED / INACTIVE</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f43f5e', marginTop: '0.2rem' }}>
            {drives.filter(d => d.approval_status === 'REJECTED' || !d.is_active).length}
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CANDIDATES POOL</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
            3 Active
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="tab-nav">
          <button 
            className={`tab-btn ${adminTab === 'drives' ? 'active' : ''}`}
            onClick={() => setAdminTab('drives')}
          >
            <Building size={16} /> Placement Drives ({drives.length})
          </button>
          <button 
            className={`tab-btn ${adminTab === 'students' ? 'active' : ''}`}
            onClick={() => setAdminTab('students')}
          >
            <UserCheck size={16} /> Student Eligibility Oversight
          </button>
          <button 
            className={`tab-btn ${adminTab === 'admins' ? 'active' : ''}`}
            onClick={() => setAdminTab('admins')}
            style={adminTab === 'admins' ? { borderColor: '#818cf8', color: '#818cf8' } : {}}
          >
            <ShieldCheck size={16} /> Admins Directory ({adminsList.length})
          </button>
          <button 
            className={`tab-btn ${adminTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setAdminTab('analytics')}
          >
            <Database size={16} /> Database & System Analytics
          </button>
        </div>

        {adminTab === 'drives' && (
          <button 
            onClick={handleOpenAddModal} 
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> Add New Drive
          </button>
        )}

        {adminTab === 'admins' && (
          <button 
            onClick={() => {
              setAdminModalError('');
              setIsAdminModalOpen(true);
            }} 
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#6366f1', color: '#fff' }}
          >
            <Plus size={18} /> Provision New Admin
          </button>
        )}
      </div>

      {/* TAB 1: PLACEMENT DRIVES MANAGEMENT */}
      {adminTab === 'drives' && (
        <div>
          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text"
                placeholder="Filter drives by company, role, or skills..."
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ALL', 'APPROVED', 'REJECTED'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: statusFilter === filter ? 'var(--primary-color)' : 'transparent',
                    border: '1px solid var(--border-color)',
                    color: statusFilter === filter ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {drivesLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <RefreshCw size={24} className="spin" />
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Loading placement drives...</p>
            </div>
          ) : filteredDrives.length === 0 ? (
            <div className="card text-center" style={{ padding: '3rem' }}>
              <AlertCircle size={36} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
              <h3>No matching placement drives found.</h3>
              <p className="text-muted">Click "+ Add New Drive" above to create one.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {filteredDrives.map((drive) => {
                const isApproved = drive.approval_status === 'APPROVED';
                return (
                  <div key={drive.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: `4px solid ${isApproved ? '#10b981' : '#f43f5e'}` }}>
                    <div>
                      {/* Top status & company */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{drive.company_name}</h3>
                          <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 600 }}>{drive.role_title}</div>
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                          color: isApproved ? '#10b981' : '#f43f5e',
                          border: `1px solid ${isApproved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                        }}>
                          {isApproved ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {drive.approval_status}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1rem' }}>
                        {drive.description}
                      </p>

                      {/* Key specs */}
                      <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>💰 Package: <strong style={{ color: '#10b981' }}>{drive.package_lpa} LPA</strong></div>
                        <div>📊 Min CGPA: <strong>{drive.min_cgpa}</strong></div>
                        <div style={{ gridColumn: 'span 2' }}>📅 Date: <strong>{drive.drive_date}</strong></div>
                        <div style={{ gridColumn: 'span 2' }}>🏛️ Depts: <strong style={{ color: 'var(--text-muted)' }}>{drive.eligibility_departments.join(', ')}</strong></div>
                      </div>

                      {/* Mandatory Skills */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                          MANDATORY REQUIREMENTS
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {drive.mandatory_skills.map((skill, idx) => (
                            <span key={idx} className="skill-tag matched" style={{ fontSize: '0.75rem' }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions Bar */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {isApproved ? (
                        <button 
                          onClick={() => handleToggleDriveStatus(drive.id, 'REJECTED')}
                          className="btn"
                          style={{ flex: 1, background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <XCircle size={14} /> Reject Drive
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleToggleDriveStatus(drive.id, 'APPROVED')}
                          className="btn"
                          style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <CheckCircle size={14} /> Approve Drive
                        </button>
                      )}

                      <button 
                        onClick={() => handleOpenEditModal(drive)}
                        className="btn btn-outline"
                        style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>

                      <button 
                        onClick={() => handleDeleteDrive(drive.id, drive.company_name)}
                        className="btn"
                        style={{ background: 'transparent', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f43f5e', padding: '0.45rem 0.65rem', borderRadius: '6px' }}
                        title="Delete Drive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENT ELIGIBILITY & APPROVALS */}
      {adminTab === 'students' && (
        <div>
          {/* Controls: Search & Drive Selector */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text"
                placeholder="Search candidates by name, student ID, or department..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', outline: 'none' }}
              />
            </div>

            <select
              value={selectedDriveFilter}
              onChange={(e) => setSelectedDriveFilter(e.target.value)}
              style={{ padding: '0.65rem 1rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">All Recruitment Drives</option>
              {drives.map(d => (
                <option key={d.id} value={d.id}>{d.company_name} — {d.role_title}</option>
              ))}
            </select>
          </div>

          {studentsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <RefreshCw size={24} className="spin" />
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Loading student candidate registry...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="card text-center" style={{ padding: '3rem' }}>
              <AlertCircle size={36} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
              <h3>No candidates match your search filter.</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredStudents.map((item) => {
                const { profile, drives: studentDrives } = item;
                return (
                  <div key={profile.student_id} className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                    {/* Student Basic Card */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CANDIDATE ID: <code>{profile.student_id}</code></div>
                        <h3 style={{ margin: '0.2rem 0', fontSize: '1.3rem', fontWeight: 800 }}>{profile.student_name}</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                          {profile.department} | CGPA: <strong style={{ color: '#10b981' }}>{profile.cgpa}</strong>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>VERIFIED SKILLS</div>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {Object.entries(profile.skills || {}).map(([skill, prof]) => (
                            <span key={skill} className="skill-tag matched" style={{ fontSize: '0.75rem' }}>
                              {skill} ({prof}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Drive Eligibility Matrix & Overrides */}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        DRIVE ELIGIBILITY AUDIT & ADMIN OVERRIDE CONTROLS:
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                        {studentDrives.map((dRec) => {
                          const isEligible = dRec.eligibility.is_eligible;
                          const override = dRec.admin_override;

                          return (
                            <div key={dRec.drive_id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <strong style={{ fontSize: '0.95rem' }}>{dRec.drive_company}</strong>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  background: isEligible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                                  color: isEligible ? '#10b981' : '#f43f5e'
                                }}>
                                  {dRec.eligibility.status}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                                {dRec.drive_role} | Readiness: <strong style={{ color: '#6366f1' }}>{dRec.readiness.readiness_score}%</strong>
                              </div>

                              {/* Gap reasons if ineligible */}
                              {!isEligible && dRec.eligibility.gap_reasons?.length > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#fb7185', background: 'rgba(244, 63, 94, 0.08)', padding: '0.4rem 0.6rem', borderRadius: '6px', marginBottom: '0.6rem' }}>
                                  {dRec.eligibility.gap_reasons.join(' • ')}
                                </div>
                              )}

                              {/* Override status indicator */}
                              {override && (
                                <div style={{ fontSize: '0.75rem', color: '#818cf8', background: 'rgba(99, 102, 241, 0.12)', padding: '0.4rem 0.6rem', borderRadius: '6px', marginBottom: '0.6rem' }}>
                                  ⚙️ <strong>Admin Override:</strong> {override.remarks || override.status}
                                </div>
                              )}

                              {/* Admin Action Buttons */}
                              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                                <button
                                  onClick={() => handleOverrideEligibility(profile.student_id, dRec.drive_id, 'APPROVED')}
                                  className="btn"
                                  style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', borderRadius: '6px' }}
                                >
                                  ⭐ Approve
                                </button>
                                <button
                                  onClick={() => handleOverrideEligibility(profile.student_id, dRec.drive_id, 'REJECTED')}
                                  className="btn"
                                  style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', borderRadius: '6px' }}
                                >
                                  ⛔ Reject
                                </button>
                                {override && (
                                  <button
                                    onClick={() => handleOverrideEligibility(profile.student_id, dRec.drive_id, 'RESET')}
                                    className="btn btn-outline"
                                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                                    title="Reset to system algorithm"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEDICATED ADMINISTRATORS DIRECTORY */}
      {adminTab === 'admins' && (
        <div className="animate-fade-in">
          {/* Information Banner */}
          <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={22} color="#818cf8" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#c7d2fe' }}>
                  MongoDB Dedicated Collection: <code>resume_analyzer.admins</code>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This separate database section stores verified Placement Officers and administrative personnel.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={fetchAdminsList} 
                className="btn btn-outline" 
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <RefreshCw size={14} className={adminsLoading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button 
                onClick={() => {
                  setAdminModalError('');
                  setIsAdminModalOpen(true);
                }} 
                className="btn btn-primary" 
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#6366f1', color: '#fff' }}
              >
                <Plus size={14} /> Add Administrator
              </button>
            </div>
          </div>

          {adminsLoading ? (
            <div className="text-center" style={{ padding: '3rem' }}>
              <RefreshCw size={28} className="animate-spin" color="#818cf8" style={{ margin: '0 auto 1rem' }} />
              <p className="text-muted">Loading administrator records from MongoDB...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {adminsList.map((adm, idx) => (
                <div key={adm._id || idx} className="card" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4338ca)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                        {(adm.username || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{adm.username}</h3>
                        <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600 }}>{adm.designation || 'Placement Officer'}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      VERIFIED ADMIN
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    <div>📧 <strong>Email:</strong> <code>{adm.email}</code></div>
                    <div>🏢 <strong>Department:</strong> {adm.department || 'Training & Placement Cell'}</div>
                    {adm.phone_number && <div>📞 <strong>Contact:</strong> {adm.phone_number}</div>}
                    <div>🔑 <strong>Role:</strong> <span style={{ color: '#818cf8', fontWeight: 600 }}>{adm.role || 'admin'}</span></div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Database ID: <code style={{ fontSize: '0.7rem' }}>{(adm._id || '').slice(-6) || 'root'}</code></span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>Active Clearance</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DATABASE & SYSTEM ANALYTICS */}
      {adminTab === 'analytics' && (
        <div className="animate-fade-in">
          {/* Database Collections Architecture */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={20} color="#818cf8" /> MongoDB Cluster Architecture (Cluster0)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              
              <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'rgba(99, 102, 241, 0.05)' }}>
                <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700 }}>COLLECTION: admins</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.3rem 0', color: '#818cf8' }}>
                  {adminsList.length || 1}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Stores Placement Officers, access clearances, and credential hashes.
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>COLLECTION: users</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.3rem 0', color: '#10b981' }}>
                  Active Pool
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Registered candidates, students, and applicant profiles.
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>COLLECTION: analyses</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.3rem 0', color: '#38bdf8' }}>
                  AI Archives
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Parsed resumes, ATS gap matches, and LLM intelligence reports.
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>COLLECTION: drives</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.3rem 0', color: '#f59e0b' }}>
                  {drives.length}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  On-campus hiring schedules, salary LPA tiers, and skill matrix.
                </div>
              </div>

            </div>
          </div>

          {/* System Security & Placement Metrics */}
          <div className="card" style={{ padding: '1.75rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#10b981" /> System Security & Access Enforcement
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.3rem' }}>Role-Based Gatekeeper (RBAC)</div>
                <div style={{ color: 'var(--text-muted)' }}>Endpoints verify tokens with <code>role: 'admin'</code> before processing drive alterations or student waivers.</div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.3rem' }}>Password Hashing</div>
                <div style={{ color: 'var(--text-muted)' }}>All administrator credentials are encrypted using bcrypt with salt rounds before persistence.</div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.3rem' }}>Session Protocol</div>
                <div style={{ color: 'var(--text-muted)' }}>Cryptographically signed JSON Web Tokens (JWT) with seamless auto-renewal and timeout protection.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROVISION NEW ADMINISTRATOR */}
      {isAdminModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="#818cf8" /> Provision New Administrator
              </h2>
              <button onClick={() => setIsAdminModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>
                ×
              </button>
            </div>

            {adminModalError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                {adminModalError}
              </div>
            )}

            <form onSubmit={handleCreateAdmin}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>FULL NAME / OFFICER NAME *</label>
                <input 
                  type="text"
                  value={adminFormData.username}
                  onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>OFFICIAL UNIVERSITY EMAIL *</label>
                <input 
                  type="email"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  placeholder="e.g. placement.officer@university.edu"
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>INITIAL ADMIN PASSWORD *</label>
                <input 
                  type="password"
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                  placeholder="Create secure access secret"
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>DESIGNATION</label>
                  <input 
                    type="text"
                    value={adminFormData.designation}
                    onChange={(e) => setAdminFormData({ ...adminFormData, designation: e.target.value })}
                    placeholder="Placement Coordinator"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>CONTACT PHONE</label>
                  <input 
                    type="text"
                    value={adminFormData.phone_number}
                    onChange={(e) => setAdminFormData({ ...adminFormData, phone_number: e.target.value })}
                    placeholder="+91-9876543210"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAdminModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: 700, background: '#6366f1', color: '#fff' }}
                >
                  Save to MongoDB Admins
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PLACEMENT DRIVE */}
      {isDriveModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }} className="animate-fade-in">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                {modalMode === 'add' ? '➕ Create New Recruitment Drive' : '✏️ Edit Drive Specifications'}
              </h2>
              <button onClick={() => setIsDriveModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>
                ×
              </button>
            </div>

            {modalError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveDrive}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>COMPANY NAME *</label>
                  <input 
                    type="text"
                    value={driveFormData.company_name}
                    onChange={(e) => setDriveFormData({ ...driveFormData, company_name: e.target.value })}
                    placeholder="e.g. Google, Atlassian"
                    required
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>ROLE TITLE *</label>
                  <input 
                    type="text"
                    value={driveFormData.role_title}
                    onChange={(e) => setDriveFormData({ ...driveFormData, role_title: e.target.value })}
                    placeholder="e.g. SDE-1, Cloud Engineer"
                    required
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>PACKAGE (LPA)</label>
                  <input 
                    type="number"
                    step="0.5"
                    value={driveFormData.package_lpa}
                    onChange={(e) => setDriveFormData({ ...driveFormData, package_lpa: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>MIN CGPA *</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={driveFormData.min_cgpa}
                    onChange={(e) => setDriveFormData({ ...driveFormData, min_cgpa: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>DRIVE DATE</label>
                  <input 
                    type="date"
                    value={driveFormData.drive_date}
                    onChange={(e) => setDriveFormData({ ...driveFormData, drive_date: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  ELIGIBLE DEPARTMENTS (comma separated)
                </label>
                <input 
                  type="text"
                  value={driveFormData.eligibility_departments}
                  onChange={(e) => setDriveFormData({ ...driveFormData, eligibility_departments: e.target.value })}
                  placeholder="Computer Science, Information Technology, Electronics"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  MANDATORY SKILLS (comma separated) *
                </label>
                <input 
                  type="text"
                  value={driveFormData.mandatory_skills}
                  onChange={(e) => setDriveFormData({ ...driveFormData, mandatory_skills: e.target.value })}
                  placeholder="Java, SQL, Problem Solving"
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  PREFERRED SKILLS (comma separated)
                </label>
                <input 
                  type="text"
                  value={driveFormData.preferred_skills}
                  onChange={(e) => setDriveFormData({ ...driveFormData, preferred_skills: e.target.value })}
                  placeholder="Docker, Kubernetes, AWS"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  JOB DESCRIPTION & EXPECTATIONS
                </label>
                <textarea 
                  rows={3}
                  value={driveFormData.description}
                  onChange={(e) => setDriveFormData({ ...driveFormData, description: e.target.value })}
                  placeholder="Describe the candidate responsibilities, team function, and hiring scope..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-color)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsDriveModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: 700 }}
                >
                  {modalMode === 'add' ? 'Create Drive' : 'Save Changes'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default PlacementAdmin;
