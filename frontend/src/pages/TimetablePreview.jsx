import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { studentsApi, calendarApi, getAuthUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function TimetablePreview() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState({});
    const [authenticated, setAuthenticated] = useState(false);

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

            if (studentsWithTT.length === 0) {
                toast.error('No timetables found. Please add students first.');
                navigate('/');
                return;
            }

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

    const totalSelected = Object.values(selectedClasses).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Timetable Preview</h1>
                    <p className="page-subtitle">Select classes to sync to Google Calendar</p>
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

            {/* Student Timetables */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {students.map(student => (
                    <div key={student.regNo} className="card">
                        {/* Student Header */}
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>
                                    {student.name}
                                </h3>
                                <p style={{ fontSize: '13px', color: '#71717a' }}>
                                    {student.regNo} • Section: {student.timetable?.section || 'N/A'} • {student.timetable?.classes?.length || 0} classes
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
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

                        {/* Classes Table */}
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
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TimetablePreview;
