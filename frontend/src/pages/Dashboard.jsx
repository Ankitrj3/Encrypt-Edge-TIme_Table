import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, calendarApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SyncStatus from '../components/SyncStatus';

function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [filters, setFilters] = useState({
        day: '',
        room: '',
        student: '',
        status: ''
    });
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        loadDashboard();
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const result = await calendarApi.getAuthStatus();
            setAuthenticated(result.data.authenticated);
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    };

    const loadDashboard = async () => {
        try {
            const result = await dashboardApi.get();
            setData(result.data);
        } catch (error) {
            console.error('Dashboard load failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = async () => {
        setLoading(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '')
            );
            const result = await dashboardApi.filter(activeFilters);
            setData(prev => ({ ...prev, students: result.data.students }));
        } catch (error) {
            console.error('Filter failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({ day: '', room: '', student: '', status: '' });
        loadDashboard();
    };

    if (loading) return <LoadingSpinner message="Loading dashboard..." />;

    const stats = data?.stats || {};

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Sync Dashboard</h1>
                    <p className="page-subtitle">Monitor students and their calendar sync status</p>
                </div>
                <div className="status-indicator">
                    <span className={`status-dot ${authenticated ? 'connected' : 'disconnected'}`}></span>
                    <span style={{ color: authenticated ? '#34d399' : '#f87171' }}>
                        {authenticated ? 'Connected' : 'Not Connected'}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalStudents || 0}</div>
                    <div className="stat-label">Total Students</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.synced || 0}</div>
                    <div className="stat-label">Synced</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.pending || 0}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value highlight">{stats.totalEvents || 0}</div>
                    <div className="stat-label">Total Events</div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="card">
                {/* Filters */}
                <div className="filters-bar">
                    <div className="filter-group">
                        <input
                            type="text"
                            className="input"
                            placeholder="Search by name or reg no..."
                            value={filters.student}
                            onChange={(e) => setFilters({ ...filters, student: e.target.value })}
                        />
                    </div>
                    <div style={{ width: '160px' }}>
                        <select
                            className="input"
                            value={filters.day}
                            onChange={(e) => setFilters({ ...filters, day: e.target.value })}
                        >
                            <option value="">All Days</option>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                <option key={day} value={day}>{day}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ width: '120px' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="Room"
                            value={filters.room}
                            onChange={(e) => setFilters({ ...filters, room: e.target.value })}
                        />
                    </div>
                    <div style={{ width: '140px' }}>
                        <select
                            className="input"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="synced">Synced</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                    <div className="filter-actions">
                        <button onClick={applyFilters} className="btn btn-primary">Filter</button>
                        <button onClick={clearFilters} className="btn btn-outline">Clear</button>
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Reg No</th>
                                <th>Phone</th>
                                <th>Classes</th>
                                <th>Rooms</th>
                                <th>Events</th>
                                <th>Status</th>
                                <th>Last Synced</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.students?.length === 0 ? (
                                <tr>
                                    <td colSpan="8">
                                        <div className="empty-state">
                                            <div className="empty-state-icon" style={{ opacity: 0.3, fontSize: '24px' }}>
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <line x1="17" y1="11" x2="22" y2="11" />
                                                </svg>
                                            </div>
                                            <div className="empty-state-text">No students found</div>
                                            <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                                                Add students to get started
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data?.students?.map((student) => (
                                    <tr key={student.regNo}>
                                        <td>
                                            <button
                                                onClick={() => navigate(`/student/${student.regNo}`)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 0,
                                                    color: '#fafafa',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    fontSize: 'inherit',
                                                    textAlign: 'left',
                                                    transition: 'color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                                                onMouseLeave={(e) => e.target.style.color = '#fafafa'}
                                                title="View timetable"
                                            >
                                                {student.name}
                                            </button>
                                        </td>
                                        <td>{student.regNo}</td>
                                        <td>{student.phone}</td>
                                        <td>{student.totalClasses}</td>
                                        <td>
                                            {student.rooms?.slice(0, 3).map((room, i) => (
                                                <span key={i} className="room-tag">{room}</span>
                                            ))}
                                            {student.rooms?.length > 3 && (
                                                <span className="room-tag">+{student.rooms.length - 3}</span>
                                            )}
                                        </td>
                                        <td>{student.eventsCreated}</td>
                                        <td>
                                            <SyncStatus status={student.syncStatus} />
                                        </td>
                                        <td style={{ fontSize: '13px' }}>
                                            {student.lastSynced
                                                ? new Date(student.lastSynced).toLocaleString('en-IN', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : '—'
                                            }
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            {data?.lastUpdated && (
                <p style={{ textAlign: 'center', fontSize: '13px', color: '#71717a', marginTop: '24px' }}>
                    Last updated: {new Date(data.lastUpdated).toLocaleString('en-IN')}
                </p>
            )}
        </div>
    );
}

export default Dashboard;
