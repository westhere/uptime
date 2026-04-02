import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function Expired() {
    return (
        <GuestLayout>
            <Head title="Invitation Expired" />

            <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Invitation Expired</h2>
                <p className="text-gray-600">
                    This invitation link has expired. Please ask the monitor owner to send a new invitation.
                </p>
                <Link href={route('dashboard')} className="text-indigo-600 hover:text-indigo-800">
                    Go to Dashboard
                </Link>
            </div>
        </GuestLayout>
    );
}
