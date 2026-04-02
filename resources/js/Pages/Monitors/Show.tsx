import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/StatusBadge';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Monitor {
    id: number;
    name: string;
    url: string;
    last_status: 'up' | 'down' | 'slow' | 'pending';
    last_checked_at: string | null;
    frequency_minutes: number;
    is_active: boolean;
    uptime_percentage: number;
    is_owner: boolean;
    can_edit: boolean;
}

interface TimelineHour {
    hour: string;
    status: 'up' | 'down' | 'slow';
    up: number;
    slow: number;
    down: number;
    total: number;
    uptime_pct: number;
    avg_response_ms: number | null;
}

interface Incident {
    id: number;
    type: 'down' | 'slow';
    started_at: string;
    resolved_at: string | null;
    duration_seconds: number | null;
}

interface NotificationPreferences {
    notify_down: boolean;
    notify_slow: boolean;
    notify_recover: boolean;
}

interface Props {
    monitor: Monitor;
    timeline: TimelineHour[];
    incidents: Incident[];
    hours: number;
    notification_preferences: NotificationPreferences;
}

const HOUR_OPTIONS = [
    { value: 1, label: 'Last 1 hour' },
    { value: 3, label: 'Last 3 hours' },
    { value: 6, label: 'Last 6 hours' },
    { value: 12, label: 'Last 12 hours' },
    { value: 24, label: 'Last 24 hours' },
    { value: 48, label: 'Last 48 hours' },
    { value: 168, label: 'Last 7 days' },
    { value: 720, label: 'Last 30 days' },
];

const statusColor: Record<string, string> = {
    up: 'bg-green-500',
    slow: 'bg-yellow-400',
    down: 'bg-red-500',
};

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function Show({ monitor, timeline, incidents, hours, notification_preferences }: Props) {
    const [tooltip, setTooltip] = useState<{ hour: TimelineHour; x: number } | null>(null);

    const notifForm = useForm(notification_preferences);

    function handleHoursChange(e: React.ChangeEvent<HTMLSelectElement>) {
        router.get(route('monitors.show', monitor.id), { hours: e.target.value }, { preserveState: true });
    }

    function submitNotifPrefs(e: React.FormEvent) {
        e.preventDefault();
        notifForm.patch(route('monitors.notifications.update', monitor.id));
    }

    function deleteMonitor() {
        if (confirm(`Delete monitor "${monitor.name}"? This cannot be undone.`)) {
            router.delete(route('monitors.destroy', monitor.id));
        }
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{monitor.name}</h2>
                        <StatusBadge status={monitor.last_status} />
                    </div>
                    <div className="flex items-center gap-2">
                        {monitor.can_edit && (
                            <Link
                                href={route('monitors.edit', monitor.id)}
                                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
                            >
                                Edit
                            </Link>
                        )}
                        {monitor.is_owner && (
                            <>
                                <Link
                                    href={route('monitors.invitations.index', monitor.id)}
                                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
                                >
                                    Manage Access
                                </Link>
                                <button
                                    onClick={deleteMonitor}
                                    className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={monitor.name} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white shadow rounded-lg p-4">
                            <p className="text-sm text-gray-500">Uptime</p>
                            <p className="text-2xl font-bold text-gray-900">{monitor.uptime_percentage}%</p>
                        </div>
                        <div className="bg-white shadow rounded-lg p-4">
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="mt-1">
                                <StatusBadge status={monitor.last_status} />
                            </p>
                        </div>
                        <div className="bg-white shadow rounded-lg p-4">
                            <p className="text-sm text-gray-500">Frequency</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {monitor.frequency_minutes}m
                            </p>
                        </div>
                        <div className="bg-white shadow rounded-lg p-4">
                            <p className="text-sm text-gray-500">Last Checked</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                                {monitor.last_checked_at
                                    ? new Date(monitor.last_checked_at).toLocaleString()
                                    : 'Never'}
                            </p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Uptime Timeline</h3>
                            <select
                                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={hours}
                                onChange={handleHoursChange}
                            >
                                {HOUR_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {timeline.length === 0 ? (
                            <p className="text-gray-500 text-sm">No data for this period yet.</p>
                        ) : (
                            <div className="relative">
                                <div className="flex gap-0.5 h-12 items-end">
                                    {timeline.map((t, i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 rounded-sm cursor-pointer ${statusColor[t.status]} opacity-80 hover:opacity-100 transition-opacity`}
                                            style={{ height: `${Math.max(20, t.uptime_pct)}%` }}
                                            onMouseEnter={(e) =>
                                                setTooltip({ hour: t, x: e.currentTarget.getBoundingClientRect().left })
                                            }
                                            onMouseLeave={() => setTooltip(null)}
                                        />
                                    ))}
                                </div>
                                {tooltip && (
                                    <div className="absolute -top-20 bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none z-10 whitespace-nowrap left-1/2 -translate-x-1/2">
                                        <div>{new Date(tooltip.hour.hour).toLocaleString()}</div>
                                        <div>Uptime: {tooltip.hour.uptime_pct}%</div>
                                        {tooltip.hour.avg_response_ms && (
                                            <div>Avg response: {tooltip.hour.avg_response_ms}ms</div>
                                        )}
                                        <div>
                                            {tooltip.hour.up} up / {tooltip.hour.slow} slow / {tooltip.hour.down} down
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Incidents */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Incidents</h3>
                            {incidents.length === 0 ? (
                                <p className="text-gray-500 text-sm">No incidents recorded.</p>
                            ) : (
                                <div className="space-y-3">
                                    {incidents.map((inc) => (
                                        <div key={inc.id} className="flex items-start justify-between text-sm">
                                            <div>
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-2 ${inc.type === 'down' ? 'bg-red-500' : 'bg-yellow-400'}`}
                                                />
                                                <span className="font-medium capitalize">{inc.type}</span>
                                                <span className="text-gray-500 ml-2">
                                                    {new Date(inc.started_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="text-gray-500 text-right">
                                                {inc.resolved_at ? (
                                                    <span className="text-green-600">
                                                        Resolved in {inc.duration_seconds ? formatDuration(inc.duration_seconds) : '—'}
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600 font-medium">Ongoing</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notification preferences */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                            <form onSubmit={submitNotifPrefs} className="space-y-3">
                                {(
                                    [
                                        { key: 'notify_down', label: 'Notify when down' },
                                        { key: 'notify_slow', label: 'Notify when slow (>15s)' },
                                        { key: 'notify_recover', label: 'Notify when recovered' },
                                    ] as const
                                ).map(({ key, label }) => (
                                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm"
                                            checked={notifForm.data[key]}
                                            onChange={(e) => notifForm.setData(key, e.target.checked)}
                                        />
                                        <span className="text-sm text-gray-700">{label}</span>
                                    </label>
                                ))}
                                <button
                                    type="submit"
                                    disabled={notifForm.processing}
                                    className="mt-2 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Save Preferences
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
