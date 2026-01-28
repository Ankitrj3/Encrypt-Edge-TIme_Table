function SyncStatus({ status }) {
    const statusConfig = {
        synced: { label: 'Synced', class: 'badge-success', icon: '✓' },
        pending: { label: 'Pending', class: 'badge-pending', icon: '○' },
        partial: { label: 'Partial', class: 'badge-warning', icon: '!' },
        failed: { label: 'Failed', class: 'badge-danger', icon: '✕' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`badge ${config.class}`}>
            {config.icon} {config.label}
        </span>
    );
}

export default SyncStatus;
