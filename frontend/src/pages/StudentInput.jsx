import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { studentsApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function StudentInput() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);

    // Load existing students on mount
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

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Students</h1>
                    <p className="page-subtitle">{students.length} students registered</p>
                </div>
                <button
                    onClick={() => navigate('/timetable')}
                    className="btn btn-primary"
                    disabled={syncedCount === 0}
                >
                    View Timetables →
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-value">{students.length}</div>
                    <div className="stat-label">Total Students</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value highlight">{syncedCount}</div>
                    <div className="stat-label">With Timetable</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{pendingCount}</div>
                    <div className="stat-label">Pending</div>
                </div>
            </div>

            {/* Students Table */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">All Students</h2>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                                <th>Student Name</th>
                                <th>Registration No</th>
                                <th>Section</th>
                                <th>Status</th>
                                <th>Classes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📭</div>
                                            <div className="empty-state-text">No students found</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                students.map((student, index) => (
                                    <tr key={student.regNo}>
                                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#71717a' }}>
                                            {index + 1}
                                        </td>
                                        <td style={{ color: '#fafafa', fontWeight: 500 }}>
                                            {student.name}
                                        </td>
                                        <td>{student.regNo}</td>
                                        <td style={{ color: '#a1a1aa' }}>
                                            {student.timetable?.section || '-'}
                                        </td>
                                        <td>
                                            {student.hasTimetable ? (
                                                <span className="badge badge-success">✓ Has Timetable</span>
                                            ) : (
                                                <span className="badge badge-pending">Pending</span>
                                            )}
                                        </td>
                                        <td>
                                            {student.timetable?.classes?.length || 0} classes
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default StudentInput;
