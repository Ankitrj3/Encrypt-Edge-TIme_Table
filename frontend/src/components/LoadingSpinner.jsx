function LoadingSpinner({ message = 'Loading...' }) {
    return (
        <div className="loading-container" style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px'
        }}>
            <div style={{
                position: 'relative',
                width: '60px',
                height: '60px'
            }}>
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    border: '3px solid rgba(139, 92, 246, 0.1)',
                    borderRadius: '50%'
                }}></div>
                <div className="spinner" style={{
                    width: '60px',
                    height: '60px',
                    border: '3px solid transparent',
                    borderTopColor: '#8b5cf6',
                    borderRightColor: '#06b6d4',
                    borderRadius: '50%'
                }}></div>
            </div>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
            }}>
                <div className="loading-text" style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: 'var(--text-primary)'
                }}>{message}</div>
                <div style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)'
                }}>Please wait a moment...</div>
            </div>
        </div>
    );
}

export default LoadingSpinner;
