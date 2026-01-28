function SyncStatus({ status }) {
    const statusConfig = {
        synced: { label: 'Synced', class: 'badge-success' },
        pending: { label: 'Pending', class: 'badge-pending' },
        partial: { label: 'Partial', class: 'badge-warning' },
        failed: { label: 'Failed', class: 'badge-danger' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`badge ${config.class}`}>
            {config.label}
        </span>
    );
}

export default SyncStatus;
