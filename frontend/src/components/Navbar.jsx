import { Link, useLocation } from 'react-router-dom';
import { getAuthUrl } from '../services/api';

function Navbar() {
    const location = useLocation();

    const navLinks = [
        { path: '/', label: 'Students', icon: '👥' },
        { path: '/timetable', label: 'Timetable', icon: '📋' },
        { path: '/dashboard', label: 'Dashboard', icon: '📊' }
    ];

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-brand">
                    <div className="nav-logo">📅</div>
                    <span className="nav-title">LPU Calendar</span>
                </Link>

                <div className="nav-links">
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                        >
                            <span style={{ marginRight: '6px' }}>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                </div>

                <a href={getAuthUrl('/api/auth/google')} className="btn btn-secondary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Connect Google
                </a>
            </div>
        </nav>
    );
}

export default Navbar;
