import GuestLayout from '@/Layouts/GuestLayout';
import { Head, router } from '@inertiajs/react';

interface Invitation {
    token: string;
    monitor_name: string;
    invited_by: string;
    permission: 'view' | 'edit';
}

export default function Accept({ invitation }: { invitation: Invitation }) {
    function accept() {
        router.post(route('invitations.confirm', invitation.token));
    }

    return (
        <GuestLayout>
            <Head title="Accept Invitation" />

            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-8 py-6 text-center">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                    </span>
                    <h2 className="text-xl font-bold text-white">You've been invited!</h2>
                </div>
                <div className="px-8 py-6 text-center space-y-4">
                    <p className="text-gray-600 text-sm">
                        <span className="font-semibold text-gray-900">{invitation.invited_by}</span> has invited you to{' '}
                        {invitation.permission === 'edit' ? 'view and edit' : 'view'} the monitor{' '}
                        <span className="font-semibold text-gray-900">{invitation.monitor_name}</span>.
                    </p>
                    <button
                        onClick={accept}
                        className="w-full inline-flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow transition"
                    >
                        Accept Invitation
                    </button>
                </div>
            </div>
        </GuestLayout>
    );
}
