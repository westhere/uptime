import AppFooter from '@/Components/AppFooter';
import AppHeader from '@/Components/AppHeader';
import { PropsWithChildren, ReactNode } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <AppHeader />

            {header && (
                <div className="bg-white border-b border-gray-200">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </div>
            )}

            <main className="flex-1">{children}</main>

            <AppFooter />
        </div>
    );
}
