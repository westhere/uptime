import GuestLayout from '@/Layouts/GuestLayout';
import PrimaryButton from '@/Components/PrimaryButton';
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

            <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">You've been invited!</h2>
                <p className="text-gray-600">
                    <strong>{invitation.invited_by}</strong> has invited you to{' '}
                    {invitation.permission === 'edit' ? 'view and edit' : 'view'} the monitor{' '}
                    <strong>{invitation.monitor_name}</strong>.
                </p>
                <PrimaryButton onClick={accept} className="w-full justify-center">
                    Accept Invitation
                </PrimaryButton>
            </div>
        </GuestLayout>
    );
}
