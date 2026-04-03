import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/StatusBadge';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

const RELOAD_INTERVAL_MS = 60_000;
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend,
    ComposedChart, Line, Area, ReferenceLine,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Monitor {
    id: string;
    name: string;
    url: string;
    last_status: 'up' | 'down' | 'slow' | 'pending';
}

interface Stats {
    total_checks: number;
    uptime_pct: number | null;
    up: number;
    slow: number;
    down: number;
    avg_response_ms: number | null;
    min_response_ms: number | null;
    max_response_ms: number | null;
    incident_count: number;
    total_downtime_seconds: number;
}

interface TimelineBucket {
    bucket: string;
    label: string;
    bucket_label: string;
    up: number;
    slow: number;
    down: number;
    total: number;
    uptime_pct: number;
    avg_response_ms: number | null;
}

interface ResponseBucket {
    bucket: string;
    label: string;
    avg_response_ms: number;
    min_response_ms: number;
    max_response_ms: number;
}

interface Incident {
    id: number;
    type: 'down' | 'slow';
    started_at: string;
    resolved_at: string | null;
    duration_seconds: number | null;
}

interface Props {
    monitor: Monitor;
    stats: Stats;
    timeline: TimelineBucket[];
    response_timeline: ResponseBucket[];
    incidents: Incident[];
    preset: string;
    range_from: string;
    range_to: string;
    is_custom: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_OPTIONS = [
    { value: '30',  label: 'Last 30 days' },
    { value: '90',  label: 'Last 90 days' },
    { value: '180', label: 'Last 6 months' },
    { value: '365', label: 'Last 12 months' },
];

const STATUS_COLORS = { up: '#22c55e', slow: '#facc15', down: '#ef4444' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
    if (seconds < 60)    return `${seconds}s`;
    if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    const days  = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
}

function uptimeColor(pct: number | null): string {
    if (pct === null) return 'text-gray-400';
    if (pct >= 99)   return 'text-green-600';
    if (pct >= 90)   return 'text-yellow-600';
    return 'text-red-600';
}

function barColor(pct: number): string {
    if (pct >= 99) return '#22c55e';
    if (pct >= 90) return '#facc15';
    return '#ef4444';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

// Custom tooltip for uptime bar chart
function UptimeTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as TimelineBucket;
    return (
        <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg">
            <p className="font-medium mb-1">{label}</p>
            <p>Uptime: {d.uptime_pct}%</p>
            <p className="text-green-400">{d.up} up · <span className="text-yellow-400">{d.slow} slow</span> · <span className="text-red-400">{d.down} down</span></p>
            {d.avg_response_ms !== null && <p className="mt-0.5 text-gray-300">Avg: {d.avg_response_ms}ms</p>}
        </div>
    );
}

// Custom tooltip for response time chart
function ResponseTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const avg = payload.find((p: any) => p.dataKey === 'avg_response_ms');
    const min = payload.find((p: any) => p.dataKey === 'min_response_ms');
    const max = payload.find((p: any) => p.dataKey === 'max_response_ms');
    return (
        <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg">
            <p className="font-medium mb-1">{label}</p>
            {avg && <p>Avg: {avg.value}ms</p>}
            {min && <p className="text-gray-300">Min: {min.value}ms</p>}
            {max && <p className="text-gray-300">Max: {max.value}ms</p>}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportShow({
    monitor, stats, timeline, response_timeline, incidents,
    preset, range_from, range_to, is_custom,
}: Props) {
    const [showCustom, setShowCustom] = useState(is_custom);
    const [customFrom, setCustomFrom] = useState(range_from);
    const [customTo, setCustomTo]     = useState(range_to);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const today = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        const timer = setInterval(() => {
            router.reload({
                only: ['monitor', 'stats', 'timeline', 'response_timeline', 'incidents'],
                onSuccess: () => setLastUpdated(new Date()),
            });
        }, RELOAD_INTERVAL_MS);
        return () => clearInterval(timer);
    }, []);

    function handlePresetChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const val = e.target.value;
        if (val === 'custom') { setShowCustom(true); return; }
        setShowCustom(false);
        router.get(route('monitors.report', monitor.id), { preset: val }, { preserveState: true });
    }

    function applyCustom(e: React.FormEvent) {
        e.preventDefault();
        router.get(route('monitors.report', monitor.id), { from: customFrom, to: customTo }, { preserveState: true });
    }

    const selectValue = showCustom ? 'custom' : preset;

    // Pie chart data — only include slices that exist
    const pieData = [
        { name: 'Up',   value: stats.up,   color: STATUS_COLORS.up },
        { name: 'Slow', value: stats.slow, color: STATUS_COLORS.slow },
        { name: 'Down', value: stats.down, color: STATUS_COLORS.down },
    ].filter(d => d.value > 0);

    // Response time data — only buckets with data
    const responseData = response_timeline;

    const bucketLabel = timeline[0]?.bucket_label ?? 'period';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('reports.index')}
                            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                            Reports
                        </Link>
                        <span className="text-gray-300">|</span>
                        <h2 className="text-xl font-semibold text-gray-800">{monitor.name}</h2>
                        <StatusBadge status={monitor.last_status} />
                    </div>

                    <div className="flex flex-wrap items-end gap-2 print:hidden">
                        {/* Range selector */}
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

                        <span className="text-xs text-gray-400 print:hidden">
                            Updated {lastUpdated.toLocaleTimeString()}
                        </span>

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
            <Head title={`Report — ${monitor.name}`} />

            <div className="py-10 print:py-4">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">

                    {/* Print header */}
                    <div className="hidden print:block">
                        <h1 className="text-2xl font-bold text-gray-900">{monitor.name} — Uptime Report</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {monitor.url} · Period: {range_from} to {range_to}
                        </p>
                    </div>

                    {/* ── Summary stats ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 col-span-2 sm:col-span-1">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Uptime</p>
                            <p className={`text-2xl font-bold ${uptimeColor(stats.uptime_pct)}`}>
                                {stats.uptime_pct !== null ? `${stats.uptime_pct}%` : '—'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{stats.total_checks.toLocaleString()} checks</p>
                        </div>
                        <StatCard
                            label="Avg Response"
                            value={stats.avg_response_ms !== null ? `${stats.avg_response_ms}ms` : '—'}
                            sub={stats.min_response_ms !== null ? `min ${stats.min_response_ms}ms` : undefined}
                        />
                        <StatCard
                            label="Max Response"
                            value={stats.max_response_ms !== null ? `${stats.max_response_ms}ms` : '—'}
                            sub="worst single check"
                        />
                        <StatCard
                            label="Incidents"
                            value={String(stats.incident_count)}
                            sub={stats.incident_count > 0 ? 'outages in period' : 'no outages'}
                        />
                        <StatCard
                            label="Total Downtime"
                            value={stats.total_downtime_seconds > 0 ? formatDuration(stats.total_downtime_seconds) : '0s'}
                            sub="across all incidents"
                        />
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Checks</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.up.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                <span className="text-yellow-500">{stats.slow}</span> slow ·{' '}
                                <span className="text-red-500">{stats.down}</span> down
                            </p>
                        </div>
                    </div>

                    {timeline.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                            <p className="text-gray-500">No check data found for this period.</p>
                        </div>
                    ) : (
                        <>
                            {/* ── Charts row ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Uptime bar chart (wider) */}
                                <SectionCard title={`Uptime by ${bucketLabel}`}>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                                            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                                            <Tooltip content={<UptimeTooltip />} />
                                            <Bar dataKey="uptime_pct" radius={[3, 3, 0, 0]}>
                                                {timeline.map((entry, i) => (
                                                    <Cell key={i} fill={barColor(entry.uptime_pct)} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </SectionCard>

                                {/* Status donut */}
                                <SectionCard title="Check breakdown">
                                    {pieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="45%"
                                                    innerRadius={55}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Legend
                                                    formatter={(value, entry: any) => (
                                                        <span className="text-xs text-gray-600">
                                                            {value} ({entry.payload.value.toLocaleString()})
                                                        </span>
                                                    )}
                                                />
                                                <Tooltip
                                                    formatter={(value) => [`${Number(value).toLocaleString()} checks`, '']}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-sm text-gray-400 text-center py-8">No data</p>
                                    )}
                                </SectionCard>
                            </div>

                            {/* ── Response time line chart ── */}
                            {responseData.length > 0 && (
                                <SectionCard title="Response time trend (ms)">
                                    <ResponsiveContainer width="100%" height={240}>
                                        <ComposedChart data={responseData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip content={<ResponseTooltip />} />
                                            <ReferenceLine
                                                y={15000}
                                                stroke="#ef4444"
                                                strokeDasharray="4 4"
                                                label={{ value: 'Slow (15s)', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }}
                                            />
                                            {/* Shaded min–max band */}
                                            <Area
                                                type="monotone"
                                                dataKey="max_response_ms"
                                                stroke="none"
                                                fill="#6366f1"
                                                fillOpacity={0.08}
                                                legendType="none"
                                                dot={false}
                                                activeDot={false}
                                                tooltipType="none"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="min_response_ms"
                                                stroke="none"
                                                fill="#ffffff"
                                                fillOpacity={1}
                                                legendType="none"
                                                dot={false}
                                                activeDot={false}
                                                tooltipType="none"
                                            />
                                            {/* Avg line */}
                                            <Line
                                                type="monotone"
                                                dataKey="avg_response_ms"
                                                stroke="#6366f1"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 4 }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Solid line = avg response. Shaded band = min–max range. Red line = slow threshold (15s).
                                    </p>
                                </SectionCard>
                            )}
                        </>
                    )}

                    {/* ── Incidents table ── */}
                    <SectionCard title={`Incidents (${incidents.length})`}>
                        {incidents.length === 0 ? (
                            <p className="text-sm text-gray-400">No incidents recorded in this period.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="py-2 pr-4 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                                            <th className="py-2 pr-4 text-left text-xs font-medium text-gray-400 uppercase">Started</th>
                                            <th className="py-2 pr-4 text-left text-xs font-medium text-gray-400 uppercase">Resolved</th>
                                            <th className="py-2 text-left text-xs font-medium text-gray-400 uppercase">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {incidents.map((inc) => (
                                            <tr key={inc.id}>
                                                <td className="py-3 pr-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${inc.type === 'down' ? 'text-red-600' : 'text-yellow-600'}`}>
                                                        <span className={`inline-block w-2 h-2 rounded-full ${inc.type === 'down' ? 'bg-red-500' : 'bg-yellow-400'}`} />
                                                        {inc.type === 'down' ? 'Down' : 'Slow'}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 text-gray-700">
                                                    {new Date(inc.started_at).toLocaleString()}
                                                </td>
                                                <td className="py-3 pr-4 text-gray-700">
                                                    {inc.resolved_at
                                                        ? new Date(inc.resolved_at).toLocaleString()
                                                        : <span className="text-red-600 font-medium">Ongoing</span>}
                                                </td>
                                                <td className="py-3 text-gray-700">
                                                    {inc.duration_seconds !== null
                                                        ? formatDuration(inc.duration_seconds)
                                                        : <span className="text-red-600 font-medium">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </SectionCard>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
