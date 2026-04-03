import AppFooter from '@/Components/AppFooter';
import AppHeader from '@/Components/AppHeader';
import { PropsWithChildren, ReactNode } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <AppHeader />

            {header && (
                <div className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </div>
            )}

            <main className="flex-1">{children}</main>

            <AppFooter />
        </div>
    );
}
