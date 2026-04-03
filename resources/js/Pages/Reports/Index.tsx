import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/StatusBadge';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface MonitorSummary {
    id: string;
    name: string;
    url: string;
    last_status: 'up' | 'down' | 'slow' | 'pending';
    is_owner: boolean;
    owner_name: string | null;
    total_checks: number;
    uptime_pct: number | null;
    avg_response_ms: number | null;
    incident_count: number;
}

interface Props {
    monitors: MonitorSummary[];
    preset: string;
    range_from: string;
    range_to: string;
    is_custom: boolean;
}

const PRESET_OPTIONS = [
    { value: '30',  label: 'Last 30 days' },
    { value: '90',  label: 'Last 90 days' },
    { value: '180', label: 'Last 6 months' },
    { value: '365', label: 'Last 12 months' },
];

function UptimePill({ pct }: { pct: number | null }) {
    if (pct === null) return <span className="text-sm text-gray-400">No data</span>;
    const color = pct >= 99 ? 'text-green-600' : pct >= 90 ? 'text-yellow-600' : 'text-red-600';
    return <span className={`text-2xl font-bold ${color}`}>{pct}%</span>;
}

export default function ReportsIndex({ monitors, preset, range_from, range_to, is_custom }: Props) {
    const [showCustom, setShowCustom] = useState(is_custom);
    const [customFrom, setCustomFrom] = useState(range_from);
    const [customTo, setCustomTo]     = useState(range_to);

    const today = new Date().toISOString().slice(0, 10);

    function handlePresetChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const val = e.target.value;
        if (val === 'custom') { setShowCustom(true); return; }
        setShowCustom(false);
        router.get(route('reports.index'), { preset: val }, { preserveState: true });
    }

    function applyCustom(e: React.FormEvent) {
        e.preventDefault();
        router.get(route('reports.index'), { from: customFrom, to: customTo }, { preserveState: true });
    }

    const selectValue = showCustom ? 'custom' : preset;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold text-gray-800">Reports</h2>
                    <div className="flex flex-wrap items-end gap-2 print:hidden">
                        <select
                            className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={selectValue}
                            onChange={handlePresetChange}
                        >
                            {PRESET_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                            <option value="custom">Custom range…</option>
                        </select>
                        {showCustom && (
                            <form onSubmit={applyCustom} className="flex flex-wrap items-end gap-2">
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-xs text-gray-500">From</label>
                                    <input
                                        type="date"
                                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={customFrom}
                                        max={customTo}
                                        onChange={(e) => setCustomFrom(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-xs text-gray-500">To</label>
                                    <input
                                        type="date"
                                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={customTo}
                                        max={today}
                                        min={customFrom}
                                        onChange={(e) => setCustomTo(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    Apply
                                </button>
                            </form>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.055 48.055 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                            </svg>
                            Print / PDF
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Reports" />

            <div className="py-12 print:py-4">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Print header */}
                    <div className="hidden print:block mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Uptime Report Overview</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Period: {range_from} to {range_to}
                        </p>
                    </div>

                    {monitors.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                            <p className="text-gray-500 mb-2">No monitors with report access yet.</p>
                            <p className="text-sm text-gray-400">
                                You can enable report access when sharing a monitor with a teammate.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {monitors.map((m) => (
                                <div
                                    key={m.id}
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                                >
                                    {/* Card header */}
                                    <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{m.url}</p>
                                            {m.owner_name && (
                                                <p className="text-xs text-indigo-500 mt-0.5">Shared by {m.owner_name}</p>
                                            )}
                                        </div>
                                        <StatusBadge status={m.last_status} />
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-3 divide-x divide-gray-100 flex-1">
                                        <div className="p-4 text-center">
                                            <p className="text-xs text-gray-400 mb-1">Uptime</p>
                                            <UptimePill pct={m.uptime_pct} />
                                        </div>
                                        <div className="p-4 text-center">
                                            <p className="text-xs text-gray-400 mb-1">Avg Response</p>
                                            <p className="text-xl font-bold text-gray-800">
                                                {m.avg_response_ms !== null ? `${m.avg_response_ms}ms` : '—'}
                                            </p>
                                        </div>
                                        <div className="p-4 text-center">
                                            <p className="text-xs text-gray-400 mb-1">Incidents</p>
                                            <p className={`text-xl font-bold ${m.incident_count > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                                {m.incident_count}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                                        <p className="text-xs text-gray-400">{m.total_checks.toLocaleString()} checks</p>
                                        <Link
                                            href={`${route('monitors.report', m.id)}?preset=${preset}${is_custom ? `&from=${range_from}&to=${range_to}` : ''}`}
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 print:hidden"
                                        >
                                            View report →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
