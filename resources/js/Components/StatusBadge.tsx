type Status = 'up' | 'down' | 'slow' | 'pending';

const config: Record<Status, { label: string; className: string }> = {
    up: { label: 'Up', className: 'bg-green-100 text-green-800 border border-green-200' },
    down: { label: 'Down', className: 'bg-red-100 text-red-800 border border-red-200' },
    slow: { label: 'Slow', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
    pending: { label: 'Pending', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
};

export default function StatusBadge({ status }: { status: Status }) {
    const { label, className } = config[status] ?? config.pending;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
            {label}
        </span>
    );
}
