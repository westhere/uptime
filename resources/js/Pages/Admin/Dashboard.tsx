import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

interface Stats {
    total_users: number;
    total_monitors: number;
    active_monitors: number;
    monitors_down: number;
    monitors_slow: number;
}

interface UserRow {
    id: number;
    name: string;
    email: string;
    monitors_count: number;
    created_at: string;
}

interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    stats: Stats;
    users: Pagination<UserRow>;
}

function StatCard({ label, value, className = '' }: { label: string; value: number; className?: string }) {
    return (
        <div className={`bg-white shadow rounded-lg p-4 ${className}`}>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
    );
}

export default function AdminDashboard({ stats, users }: Props) {
    function removeUser(id: number, name: string) {
        if (confirm(`Remove user "${name}" from the system? This will delete all their monitors and data.`)) {
            router.delete(route('admin.users.destroy', id));
        }
    }

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Admin Panel</h2>}
        >
            <Head title="Admin" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <StatCard label="Total Users" value={stats.total_users} />
                        <StatCard label="Total Monitors" value={stats.total_monitors} />
                        <StatCard label="Active Monitors" value={stats.active_monitors} />
                        <StatCard label="Monitors Down" value={stats.monitors_down} className={stats.monitors_down > 0 ? 'border-l-4 border-red-500' : ''} />
                        <StatCard label="Monitors Slow" value={stats.monitors_slow} className={stats.monitors_slow > 0 ? 'border-l-4 border-yellow-400' : ''} />
                    </div>

                    {/* Users table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Users ({users.total})</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Monitors
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.monitors_count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.created_at}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => removeUser(user.id, user.name)}
                                                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex gap-1">
                                {users.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`px-3 py-1 rounded text-sm ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : link.url
                                                  ? 'bg-white border border-gray-300 hover:bg-gray-50'
                                                  : 'bg-white border border-gray-200 text-gray-400 cursor-default'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
