import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { studentsApi, calendarApi, getAuthUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Search Icon
const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

// Chevron Down Icon
const ChevronDownIcon = ({ isOpen }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

function TimetablePreview() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState({});
    const [authenticated, setAuthenticated] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedStudents, setExpandedStudents] = useState({});

    const toggleExpanded = (regNo) => {
        setExpandedStudents(prev => ({
            ...prev,
            [regNo]: !prev[regNo]
        }));
    };

    useEffect(() => {
        loadData();
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

    const loadData = async () => {
        try {
            const result = await studentsApi.getAll();
            const studentsWithTT = result.data.students.filter(s => s.hasTimetable);

            const fullData = await Promise.all(
                studentsWithTT.map(async (s) => {
                    try {
                        const ttResult = await fetch(getAuthUrl(`/api/timetable/${s.regNo}`));
                        const data = await ttResult.json();
                        return { ...s, ...data };
                    } catch {
                        return s;
                    }
                })
            );

            setStudents(fullData);

            const initial = {};
            fullData.forEach(s => {
                if (s.timetable?.classes) {
                    initial[s.regNo] = s.timetable.classes.map((_, i) => i);
                }
            });
            setSelectedClasses(initial);
        } catch (error) {
            toast.error('Failed to load timetables');
        } finally {
            setLoading(false);
        }
    };

    const toggleClass = (regNo, classIndex) => {
        setSelectedClasses(prev => {
            const current = prev[regNo] || [];
            if (current.includes(classIndex)) {
                return { ...prev, [regNo]: current.filter(i => i !== classIndex) };
            } else {
                return { ...prev, [regNo]: [...current, classIndex] };
            }
        });
    };

    const selectAll = (regNo) => {
        const student = students.find(s => s.regNo === regNo);
        if (student?.timetable?.classes) {
            setSelectedClasses(prev => ({
                ...prev,
                [regNo]: student.timetable.classes.map((_, i) => i)
            }));
        }
    };

    const deselectAll = (regNo) => {
        setSelectedClasses(prev => ({ ...prev, [regNo]: [] }));
    };

    const handleSync = async () => {
        if (!authenticated) {
            toast.error('Please connect Google Calendar first');
            window.location.href = getAuthUrl('/api/auth/google');
            return;
        }

        const regNos = Object.keys(selectedClasses).filter(
            regNo => selectedClasses[regNo]?.length > 0
        );

        if (regNos.length === 0) {
            toast.error('Please select at least one class to sync');
            return;
        }

        setSyncing(true);
        try {
            const result = await calendarApi.sync(regNos, selectedClasses);

            if (result.data.synced > 0) {
                const totalEvents = result.data.results.success.reduce(
                    (sum, s) => sum + s.eventsCreated, 0
                );
                toast.success(`Created ${totalEvents} calendar events`);
                navigate('/dashboard');
            } else {
                toast.error('Sync failed for all students');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading timetables..." />;
    if (syncing) return <LoadingSpinner message="Syncing to Google Calendar..." />;

    // Filter students based on search query
    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.regNo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalSelected = Object.values(selectedClasses).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="page-title">Timetable Preview</h1>
                    <p className="page-subtitle">
                        {students.length} students with timetables • Select classes to sync to Google Calendar
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {!authenticated && (
                        <a href={getAuthUrl('/api/auth/google')} className="btn btn-outline">
                            Connect Google
                        </a>
                    )}
                    <button
                        onClick={handleSync}
                        className="btn btn-primary"
                        disabled={!authenticated || totalSelected === 0}
                    >
                        Sync {totalSelected} Classes
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    position: 'relative',
                    maxWidth: '400px'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none'
                    }}>
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by student name or registration number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            paddingLeft: '44px',
                            width: '100%'
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '18px',
                                lineHeight: 1
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Found {filteredStudents.length} of {students.length} students
                    </p>
                )}
            </div>

            {/* Auth Warning */}
            {!authenticated && (
                <div style={{
                    padding: '16px 20px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    fontSize: '14px',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Connect your Google Calendar to sync events
                </div>
            )}

            {/* Empty State */}
            {students.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <div style={{ marginBottom: '16px', opacity: 0.4 }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        No Timetables Found
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        Add students with timetables to get started
                    </p>
                    <button onClick={() => navigate('/')} className="btn btn-primary">
                        Go to Students
                    </button>
                </div>
            )}

            {/* No Search Results */}
            {students.length > 0 && filteredStudents.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ marginBottom: '16px', opacity: 0.4 }}>
                        <SearchIcon />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        No matching students
                    </h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        No students found matching "{searchQuery}"
                    </p>
                    <button
                        onClick={() => setSearchQuery('')}
                        style={{
                            marginTop: '16px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-primary)',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Clear search
                    </button>
                </div>
            )}

            {/* Student Timetables */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {filteredStudents.map(student => (
                    <div key={student.regNo} className="card">
                        {/* Student Header */}
                        <div
                            className="card-header"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onClick={() => toggleExpanded(student.regNo)}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ChevronDownIcon isOpen={expandedStudents[student.regNo]} />
                                <div>
                                    <h3 style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: '#fafafa',
                                        marginBottom: '4px',
                                        transition: 'color 0.2s'
                                    }}>
                                        {student.name}
                                    </h3>
                                    <p style={{ fontSize: '13px', color: '#71717a' }}>
                                        {student.regNo} • Section: {student.timetable?.section || 'N/A'} • {student.timetable?.classes?.length || 0} classes
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }} onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => selectAll(student.regNo)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer' }}
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={() => deselectAll(student.regNo)}
                                    style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '13px', cursor: 'pointer' }}
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>

                        {/* Classes Table - Only show when expanded */}
                        {expandedStudents[student.regNo] && (
                            <>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '50px', textAlign: 'center' }}>Sync</th>
                                                <th>Day</th>
                                                <th>Time</th>
                                                <th>Course</th>
                                                <th>Room</th>
                                                <th>Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {student.timetable?.classes?.map((cls, index) => (
                                                <tr key={index}>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedClasses[student.regNo]?.includes(index)}
                                                            onChange={() => toggleClass(student.regNo, index)}
                                                        />
                                                    </td>
                                                    <td style={{ fontWeight: 500, color: '#fafafa' }}>{cls.day}</td>
                                                    <td>{cls.startTime} - {cls.endTime}</td>
                                                    <td>
                                                        <span className="badge badge-info">{cls.course}</span>
                                                    </td>
                                                    <td>{cls.room}</td>
                                                    <td>
                                                        <span className={`badge ${cls.type === 'Practical' ? 'badge-warning' : 'badge-success'}`}>
                                                            {cls.type}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Selection Count */}
                                <div style={{
                                    padding: '12px 24px',
                                    background: '#09090b',
                                    borderTop: '1px solid #27272a',
                                    fontSize: '13px',
                                    color: '#71717a',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                        {selectedClasses[student.regNo]?.length || 0}
                                    </span> of {student.timetable?.classes?.length || 0} classes selected
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TimetablePreview;
