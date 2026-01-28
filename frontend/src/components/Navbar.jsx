import { Link, useLocation } from 'react-router-dom';

function Navbar() {
    const location = useLocation();

    const navLinks = [
        { path: '/', label: 'Students' },
        { path: '/timetable', label: 'Timetable' },
        { path: '/dashboard', label: 'Dashboard' }
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
                            {link.label}
                        </Link>
                    ))}
                </div>

                <a href="/api/auth/google" className="btn btn-secondary">
                    Connect Google
                </a>
            </div>
        </nav>
    );
}

export default Navbar;
