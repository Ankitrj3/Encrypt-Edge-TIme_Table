import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { studentsApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// SVG Icons
const UsersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const ClockIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const CalendarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

function StudentInput() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const result = await studentsApi.getAll();
            setStudents(result.data.students || []);
        } catch (error) {
            console.error('Failed to load students:', error);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading students..." />;
    }

    const pendingCount = students.filter(s => !s.hasTimetable).length;
    const syncedCount = students.filter(s => s.hasTimetable).length;
    const totalClasses = students.reduce((sum, s) => sum + (s.classCount || 0), 0);

    return (
        <div className="page-container animate-fade-in">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-gradient"></div>
                <div className="hero-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                        <div>
                            <h1 className="hero-title">Student Management</h1>
                            <p className="hero-subtitle">
                                Manage your students and sync their timetables to Google Calendar
                            </p>
                            <div className="hero-stats">
                                <div className="hero-stat">
                                    <div className="hero-stat-value">{students.length}</div>
                                    <div className="hero-stat-label">Total Students</div>
                                </div>
                                <div className="hero-stat">
                                    <div className="hero-stat-value">{syncedCount}</div>
                                    <div className="hero-stat-label">With Timetable</div>
                                </div>
                                <div className="hero-stat">
                                    <div className="hero-stat-value">{totalClasses}</div>
                                    <div className="hero-stat-label">Total Classes</div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/timetable')}
                            className="btn btn-primary"
                            disabled={syncedCount === 0}
                            style={{ marginTop: '8px' }}
                        >
                            <CalendarIcon />
                            View Timetables
                            <ArrowRightIcon />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="stats-grid mb-32" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card animate-slide-up stagger-1">
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                        <UsersIcon />
                    </div>
                    <div className="stat-value">{students.length}</div>
                    <div className="stat-label">Total Students</div>
                </div>
                <div className="stat-card animate-slide-up stagger-2">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                        <CheckCircleIcon />
                    </div>
                    <div className="stat-value highlight">{syncedCount}</div>
                    <div className="stat-label">With Timetable</div>
                </div>
                <div className="stat-card animate-slide-up stagger-3">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                        <ClockIcon />
                    </div>
                    <div className="stat-value">{pendingCount}</div>
                    <div className="stat-label">Pending</div>
                </div>
            </div>

            {/* Students Table Card */}
            <div className="card animate-slide-up stagger-4">
                <div className="card-header">
                    <div>
                        <h2 className="card-title">All Students</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {students.length} students registered in the system
                        </p>
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                                <th>Student Name</th>
                                <th>Registration No</th>
                                <th>Section</th>
                                <th>Status</th>
                                <th>Classes</th>
                                <th style={{ textAlign: 'center' }}>Sync Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="empty-state">
                                            <div className="empty-state-icon" style={{ opacity: 0.3 }}>
                                                <UsersIcon />
                                            </div>
                                            <div className="empty-state-text">No students found</div>
                                            <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '14px' }}>
                                                Add students to get started
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                students.map((student, index) => (
                                    <tr key={student.regNo}>
                                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                                            {index + 1}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 600,
                                                    fontSize: '14px',
                                                    color: 'var(--accent-primary)'
                                                }}>
                                                    {student.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                                    {student.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <code style={{
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '13px'
                                            }}>
                                                {student.regNo}
                                            </code>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {student.timetable?.section || '-'}
                                        </td>
                                        <td>
                                            {student.hasTimetable ? (
                                                <span className="badge badge-success">
                                                    Has Timetable
                                                </span>
                                            ) : (
                                                <span className="badge badge-pending">Pending</span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                color: student.classCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                                                fontWeight: 500
                                            }}>
                                                {student.classCount || 0} classes
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {student.syncStatus === 'synced' ? (
                                                <span className="badge badge-success">
                                                    Synced
                                                </span>
                                            ) : (
                                                <span className="badge badge-pending">
                                                    Not Synced
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer info */}
                {students.length > 0 && (
                    <div style={{
                        padding: '16px 28px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                        color: 'var(--text-muted)'
                    }}>
                        <span>Showing {students.length} students</span>
                        <span>
                            <span style={{ color: 'var(--accent-success)' }}>{syncedCount}</span> synced ·
                            <span style={{ marginLeft: '4px' }}>{pendingCount} pending</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentInput;
