import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function Expired() {
    return (
        <GuestLayout>
            <Head title="Invitation Expired" />

            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-br from-gray-600 to-gray-800 px-8 py-6 text-center">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </span>
                    <h2 className="text-xl font-bold text-white">Invitation Expired</h2>
                </div>
                <div className="px-8 py-6 text-center space-y-4">
                    <p className="text-gray-600 text-sm">
                        This invitation link has expired. Please ask the monitor owner to send a new invitation.
                    </p>
                    <Link
                        href={route('dashboard')}
                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
