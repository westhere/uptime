import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AppHeader() {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <ApplicationLogo className="h-8 w-auto fill-current text-indigo-600" />
                            <span className="text-lg font-bold text-gray-900 hidden sm:block">
                                VOiD Uptime
                            </span>
                        </Link>

                        {user && (
                            <nav className="hidden sm:flex items-center gap-6">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </NavLink>
                                <NavLink
                                    href={route('reports.index')}
                                    active={route().current('reports.*')}
                                >
                                    Reports
                                </NavLink>
                                {user.is_admin && (
                                    <NavLink
                                        href={route('admin.dashboard')}
                                        active={route().current('admin.*')}
                                    >
                                        Admin
                                    </NavLink>
                                )}
                            </nav>
                        )}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <div className="hidden sm:block">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                                            >
                                                {user.name}
                                                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content>
                                            <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                            <Dropdown.Link href={route('logout')} method="post" as="button">
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>

                                {/* Mobile hamburger */}
                                <button
                                    onClick={() => setMobileOpen((v) => !v)}
                                    className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                                >
                                    <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                        <path className={!mobileOpen ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                        <path className={mobileOpen ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href={route('login')}
                                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href={route('login') + '#register'}
                                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    Get started free
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {user && mobileOpen && (
                <div className="sm:hidden border-t border-gray-200">
                    <div className="space-y-1 pb-3 pt-2 px-4">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('reports.index')} active={route().current('reports.*')}>
                            Reports
                        </ResponsiveNavLink>
                        {user.is_admin && (
                            <ResponsiveNavLink href={route('admin.dashboard')} active={route().current('admin.*')}>
                                Admin
                            </ResponsiveNavLink>
                        )}
                    </div>
                    <div className="border-t border-gray-200 pb-3 pt-4 px-4">
                        <p className="text-base font-medium text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>Profile</ResponsiveNavLink>
                            <ResponsiveNavLink method="post" href={route('logout')} as="button">
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
