import AppFooter from '@/Components/AppFooter';
import AppHeader from '@/Components/AppHeader';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <AppHeader />
            <main className="flex-1 flex items-center justify-center py-12 px-4">
                {children}
            </main>
            <AppFooter />
        </div>
    );
}
