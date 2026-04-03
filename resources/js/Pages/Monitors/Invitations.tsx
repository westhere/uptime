import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router, useForm } from '@inertiajs/react';

interface MonitorSummary {
    id: string;
    name: string;
}

interface Invitation {
    id: number;
    email: string;
    permission: 'view' | 'edit';
    view_reports: boolean;
    is_accepted: boolean;
    is_expired: boolean;
    is_pending: boolean;
    created_at: string;
    expires_at: string;
}

interface Share {
    id: number;
    user_id: number;
    name: string;
    email: string;
    permission: 'view' | 'edit';
    view_reports: boolean;
}

interface Props {
    monitor: MonitorSummary;
    invitations: Invitation[];
    shares: Share[];
}

export default function Invitations({ monitor, invitations, shares }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        permission: 'view' as 'view' | 'edit',
        view_reports: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('monitors.invitations.store', monitor.id), { onSuccess: () => reset() });
    }

    function updateShare(shareId: number, updates: { permission?: string; view_reports?: boolean }) {
        const share = shares.find(s => s.id === shareId)!;
        router.patch(route('shares.update', shareId), {
            permission: share.permission,
            view_reports: share.view_reports,
            ...updates,
        });
    }

    function removeAccess(shareId: number) {
        if (confirm('Remove this user\'s access?')) {
            router.delete(route('shares.destroy', shareId));
        }
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('monitors.show', monitor.id)}
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                        {monitor.name}
                    </Link>
                    <span className="text-gray-300">|</span>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Manage Access</h2>
                </div>
            }
        >
            <Head title={`Manage Access — ${monitor.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
                    {/* Invite form */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Invite Someone</h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="flex gap-3 items-end flex-wrap">
                                <div className="flex-1 min-w-48">
                                    <InputLabel htmlFor="email" value="Email address" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="colleague@example.com"
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="permission" value="Permission" />
                                    <select
                                        id="permission"
                                        className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                        value={data.permission}
                                        onChange={(e) => setData('permission', e.target.value as 'view' | 'edit')}
                                    >
                                        <option value="view">View only</option>
                                        <option value="edit">Can edit</option>
                                    </select>
                                </div>
                                <PrimaryButton disabled={processing}>Send Invite</PrimaryButton>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm"
                                    checked={data.view_reports}
                                    onChange={(e) => setData('view_reports', e.target.checked)}
                                />
                                <span className="text-sm text-gray-700">Can view reports</span>
                            </label>
                        </form>
                    </div>

                    {/* Active shares */}
                    {shares.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="text-base font-semibold text-gray-900">People with Access</h3>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {shares.map((share) => (
                                    <li key={share.id} className="px-6 py-4">
                                        <div className="flex items-center justify-between gap-4 flex-wrap">
                                            <div>
                                                <p className="font-medium text-gray-900">{share.name}</p>
                                                <p className="text-sm text-gray-500">{share.email}</p>
                                            </div>
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <select
                                                    className="rounded-md border-gray-300 text-sm shadow-sm"
                                                    value={share.permission}
                                                    onChange={(e) => updateShare(share.id, { permission: e.target.value })}
                                                >
                                                    <option value="view">View only</option>
                                                    <option value="edit">Can edit</option>
                                                </select>
                                                <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm"
                                                        checked={share.view_reports}
                                                        onChange={(e) => updateShare(share.id, { view_reports: e.target.checked })}
                                                    />
                                                    Reports
                                                </label>
                                                <button
                                                    onClick={() => removeAccess(share.id)}
                                                    className="text-sm text-red-600 hover:text-red-800"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Pending invitations */}
                    {invitations.filter((i) => i.is_pending).length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="text-base font-semibold text-gray-900">Pending Invitations</h3>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {invitations
                                    .filter((i) => i.is_pending)
                                    .map((inv) => (
                                        <li key={inv.id} className="px-6 py-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{inv.email}</p>
                                                <p className="text-sm text-gray-500">
                                                    {inv.permission === 'edit' ? 'Can edit' : 'View only'}
                                                    {inv.view_reports && ' · Reports'}
                                                    {' · '}Expires {new Date(inv.expires_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="text-sm text-yellow-600 font-medium">Pending</span>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
