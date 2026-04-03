import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/StatusBadge';
import { Head, Link } from '@inertiajs/react';

interface TimelineBucket {
    status: 'up' | 'down' | 'slow';
    uptime_pct: number;
}

interface Monitor {
    id: string;
    name: string;
    url: string;
    last_status: 'up' | 'down' | 'slow' | 'pending';
    is_active: boolean;
    has_open_incident: boolean;
    timeline: TimelineBucket[];
    permission?: string;
    owner?: string;
}

interface Props {
    ownedMonitors: Monitor[];
    sharedMonitors: Monitor[];
}

const statusColor: Record<string, string> = {
    up:   'bg-green-500',
    slow: 'bg-yellow-400',
    down: 'bg-red-500',
};

function MiniTimeline({ timeline }: { timeline: TimelineBucket[] }) {
    if (timeline.length === 0) {
        return <span className="text-xs text-gray-400">No data</span>;
    }

    return (
        <div className="flex gap-px h-8 items-end w-full">
            {timeline.map((t, i) => (
                <div
                    key={i}
                    title={`${t.uptime_pct}% uptime`}
                    className={`flex-1 rounded-sm ${statusColor[t.status]} opacity-80`}
                    style={{ height: `${Math.max(20, t.uptime_pct)}%` }}
                />
            ))}
        </div>
    );
}

function MonitorRow({ monitor, showOwner = false }: { monitor: Monitor; showOwner?: boolean }) {
    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">{monitor.name}</div>
                <div className="text-sm text-gray-500 truncate max-w-xs">{monitor.url}</div>
            </td>
            {showOwner && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{monitor.owner}</td>
            )}
            <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={monitor.last_status} />
            </td>
            <td className="px-6 py-4 w-full">
                <MiniTimeline timeline={monitor.timeline} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <Link
                    href={route('monitors.show', monitor.id)}
                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                >
                    View
                </Link>
            </td>
        </tr>
    );
}

function MonitorTable({
    monitors,
    showOwner = false,
    emptyMessage,
}: {
    monitors: Monitor[];
    showOwner?: boolean;
    emptyMessage: string;
}) {
    if (monitors.length === 0) {
        return <p className="text-gray-500 py-8 text-center">{emptyMessage}</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Monitor
                        </th>
                        {showOwner && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Owner
                            </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-full">
                            Last 6 hours
                        </th>
                        <th className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {monitors.map((m) => (
                        <MonitorRow key={m.id} monitor={m} showOwner={showOwner} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function Dashboard({ ownedMonitors, sharedMonitors }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Dashboard</h2>
                    <Link
                        href={route('monitors.create')}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        + Add Monitor
                    </Link>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">My Monitors</h3>
                        </div>
                        <MonitorTable
                            monitors={ownedMonitors}
                            emptyMessage="No monitors yet. Click '+ Add Monitor' to get started."
                        />
                    </div>

                    {sharedMonitors.length > 0 && (
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Shared With Me</h3>
                            </div>
                            <MonitorTable monitors={sharedMonitors} showOwner emptyMessage="" />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
