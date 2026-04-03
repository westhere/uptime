import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router, useForm } from '@inertiajs/react';

interface MonitorSummary {
    id: number;
    name: string;
}

interface Invitation {
    id: number;
    email: string;
    permission: 'view' | 'edit';
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
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('monitors.invitations.store', monitor.id), { onSuccess: () => reset() });
    }

    function updatePermission(shareId: number, permission: string) {
        router.patch(route('shares.update', shareId), { permission });
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
                    <Link href={route('monitors.show', monitor.id)} className="text-gray-500 hover:text-gray-700">
                        ← {monitor.name}
                    </Link>
                    <span className="text-gray-400">/</span>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Manage Access</h2>
                </div>
            }
        >
            <Head title={`Manage Access — ${monitor.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
                    {/* Invite form */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Someone</h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
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
                                        className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.permission}
                                        onChange={(e) => setData('permission', e.target.value as 'view' | 'edit')}
                                    >
                                        <option value="view">View only</option>
                                        <option value="edit">Can edit</option>
                                    </select>
                                </div>
                                <PrimaryButton disabled={processing}>Send Invite</PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Active shares */}
                    {shares.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="text-lg font-medium text-gray-900">People with Access</h3>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {shares.map((share) => (
                                    <li key={share.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{share.name}</p>
                                            <p className="text-sm text-gray-500">{share.email}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <select
                                                className="rounded-md border-gray-300 text-sm shadow-sm"
                                                value={share.permission}
                                                onChange={(e) => updatePermission(share.id, e.target.value)}
                                            >
                                                <option value="view">View only</option>
                                                <option value="edit">Can edit</option>
                                            </select>
                                            <button
                                                onClick={() => removeAccess(share.id)}
                                                className="text-sm text-red-600 hover:text-red-800"
                                            >
                                                Remove
                                            </button>
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
                                <h3 className="text-lg font-medium text-gray-900">Pending Invitations</h3>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {invitations
                                    .filter((i) => i.is_pending)
                                    .map((inv) => (
                                        <li key={inv.id} className="px-6 py-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{inv.email}</p>
                                                <p className="text-sm text-gray-500">
                                                    {inv.permission === 'edit' ? 'Can edit' : 'View only'} ·
                                                    Expires {new Date(inv.expires_at).toLocaleDateString()}
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
