import { Link, usePage } from '@inertiajs/react';

export default function AppFooter() {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">VOiD Uptime</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} VOiD Applications. All rights reserved.
                        </span>
                    </div>
                    {!user && (
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <Link href={route('login')} className="hover:text-gray-700">Sign in</Link>
                            <Link href={route('login')} className="hover:text-gray-700">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
}
