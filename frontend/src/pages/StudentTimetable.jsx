import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { timetableApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Back Arrow Icon
const BackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

// Calendar Icon
const CalendarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

// Clock Icon
const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

// Day colors for visual distinction
const dayColors = {
    'Monday': { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171' },
    'Tuesday': { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)', text: '#fb923c' },
    'Wednesday': { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', text: '#facc15' },
    'Thursday': { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', text: '#4ade80' },
    'Friday': { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa' },
    'Saturday': { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)', text: '#c084fc' }
};

function StudentTimetable() {
    const { regNo } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [timetable, setTimetable] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'day'
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        loadTimetable();
    }, [regNo]);

    const loadTimetable = async () => {
        try {
            const result = await timetableApi.get(regNo);
            setStudent({
                name: result.data.student.name,
                regNo: result.data.student.regNo,
                section: result.data.student.section
            });
            setTimetable(result.data.student.timetable);
        } catch (error) {
            console.error('Failed to load timetable:', error);
            toast.error('Failed to load student timetable');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const groupByDay = (classes) => {
        const grouped = {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        days.forEach(day => {
            grouped[day] = classes?.filter(c => c.day === day) || [];
        });

        return grouped;
    };

    if (loading) return <LoadingSpinner message="Loading student timetable..." />;

    if (!student || !timetable) {
        return (
            <div className="page-container animate-fade-in">
                <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <div style={{ marginBottom: '16px', opacity: 0.4 }}>
                        <CalendarIcon />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        No Timetable Found
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        This student doesn't have a timetable yet
                    </p>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const groupedClasses = groupByDay(timetable.classes);
    const totalClasses = timetable.classes?.length || 0;
    const daysWithClasses = Object.entries(groupedClasses).filter(([_, classes]) => classes.length > 0);

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-outline"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            fontSize: '14px'
                        }}
                    >
                        <BackIcon />
                        Back
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                {student.name}
                            </span>
                        </h1>
                        <p className="page-subtitle" style={{ marginTop: '4px' }}>
                            <span style={{ color: '#a1a1aa' }}>{student.regNo}</span>
                            <span style={{ margin: '0 8px', color: '#3f3f46' }}>•</span>
                            <span style={{ color: '#a1a1aa' }}>Section: {timetable.section || 'N/A'}</span>
                            <span style={{ margin: '0 8px', color: '#3f3f46' }}>•</span>
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>{totalClasses} classes</span>
                        </p>
                    </div>

                    {/* View Toggle */}
                    <div style={{
                        display: 'flex',
                        background: '#18181b',
                        borderRadius: '8px',
                        padding: '4px',
                        border: '1px solid #27272a'
                    }}>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                background: viewMode === 'list' ? '#27272a' : 'transparent',
                                color: viewMode === 'list' ? '#fafafa' : '#71717a'
                            }}
                        >
                            All Classes
                        </button>
                        <button
                            onClick={() => setViewMode('day')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                background: viewMode === 'day' ? '#27272a' : 'transparent',
                                color: viewMode === 'day' ? '#fafafa' : '#71717a'
                            }}
                        >
                            By Day
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                {daysWithClasses.map(([day, classes]) => (
                    <div
                        key={day}
                        className="stat-card"
                        onClick={() => {
                            setViewMode('day');
                            setSelectedDay(day);
                        }}
                        style={{
                            cursor: 'pointer',
                            borderColor: selectedDay === day ? dayColors[day]?.border : undefined,
                            background: selectedDay === day ? dayColors[day]?.bg : undefined,
                            transition: 'all 0.2s'
                        }}
                    >
                        <div className="stat-value" style={{ color: dayColors[day]?.text }}>{classes.length}</div>
                        <div className="stat-label">{day}</div>
                    </div>
                ))}
            </div>

            {/* Day Filter Pills (shown in day view) */}
            {viewMode === 'day' && (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => setSelectedDay(null)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: selectedDay === null ? '#ef4444' : '#27272a',
                            background: selectedDay === null ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                            color: selectedDay === null ? '#ef4444' : '#71717a',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                    >
                        All Days
                    </button>
                    {daysWithClasses.map(([day]) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: '1px solid',
                                borderColor: selectedDay === day ? dayColors[day]?.border : '#27272a',
                                background: selectedDay === day ? dayColors[day]?.bg : 'transparent',
                                color: selectedDay === day ? dayColors[day]?.text : '#71717a',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fafafa' }}>
                            Weekly Schedule
                        </h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Day</th>
                                    <th>Time</th>
                                    <th>Course</th>
                                    <th>Room</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timetable.classes?.map((cls, index) => (
                                    <tr key={index}>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 12px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                background: dayColors[cls.day]?.bg,
                                                color: dayColors[cls.day]?.text,
                                                border: `1px solid ${dayColors[cls.day]?.border}`
                                            }}>
                                                {cls.day}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500, color: '#fafafa' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <ClockIcon />
                                                {cls.startTime} - {cls.endTime}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-info">{cls.course}</span>
                                        </td>
                                        <td style={{ color: '#a1a1aa' }}>{cls.room}</td>
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
                </div>
            )}

            {/* Day View */}
            {viewMode === 'day' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {(selectedDay ? [[selectedDay, groupedClasses[selectedDay]]] : daysWithClasses).map(([day, classes]) => (
                        <div key={day} className="card" style={{
                            borderColor: dayColors[day]?.border,
                            overflow: 'hidden'
                        }}>
                            {/* Day Header */}
                            <div style={{
                                padding: '16px 24px',
                                background: dayColors[day]?.bg,
                                borderBottom: `1px solid ${dayColors[day]?.border}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: dayColors[day]?.text
                                }}>
                                    {day}
                                </h3>
                                <span style={{
                                    fontSize: '13px',
                                    color: '#a1a1aa',
                                    background: '#18181b',
                                    padding: '4px 12px',
                                    borderRadius: '12px'
                                }}>
                                    {classes.length} {classes.length === 1 ? 'class' : 'classes'}
                                </span>
                            </div>

                            {/* Classes List */}
                            <div style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {classes.map((cls, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '16px',
                                                background: '#18181b',
                                                borderRadius: '12px',
                                                border: '1px solid #27272a'
                                            }}
                                        >
                                            {/* Time */}
                                            <div style={{
                                                minWidth: '100px',
                                                textAlign: 'center',
                                                padding: '8px 12px',
                                                background: '#09090b',
                                                borderRadius: '8px',
                                                border: '1px solid #27272a'
                                            }}>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>
                                                    {cls.startTime}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#71717a' }}>to</div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>
                                                    {cls.endTime}
                                                </div>
                                            </div>

                                            {/* Course Details */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '15px',
                                                    fontWeight: 600,
                                                    color: '#fafafa',
                                                    marginBottom: '4px'
                                                }}>
                                                    {cls.course}
                                                </div>
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: '#71717a',
                                                    display: 'flex',
                                                    gap: '12px'
                                                }}>
                                                    <span>Room: {cls.room}</span>
                                                </div>
                                            </div>

                                            {/* Type Badge */}
                                            <span className={`badge ${cls.type === 'Practical' ? 'badge-warning' : 'badge-success'}`}>
                                                {cls.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default StudentTimetable;
