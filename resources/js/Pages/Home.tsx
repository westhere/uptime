import AppFooter from '@/Components/AppFooter';
import AppHeader from '@/Components/AppHeader';
import { Head, Link } from '@inertiajs/react';

const features = [
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
        title: 'Monitor every minute',
        description: 'Check your sites as frequently as every 60 seconds. Catch outages the moment they happen, not hours later.',
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
        ),
        title: 'Instant email alerts',
        description: 'Get notified the moment a site goes down or becomes slow. Separate alerts for recovery so you always know current status.',
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
        ),
        title: 'Uptime history & trends',
        description: 'View hourly aggregated timelines across any date range. Track uptime percentage and spot patterns before they become problems.',
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
        ),
        title: 'Team sharing',
        description: 'Invite teammates to your monitors with view or edit permissions. Manage access and keep the whole team in the loop.',
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
        ),
        title: 'GDPR compliant',
        description: 'All monitoring data is retained for exactly 4 years then automatically purged. Self-hosted means your data stays yours.',
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 6 0m-6 0H3m16.5 0a3 3 0 0 0 3-3m-3 3a3 3 0 1 1-6 0m6 0h1.5m-7.5 0v3.75m0-3.75h-1.5M9.75 9.75h4.5" />
            </svg>
        ),
        title: 'Slow response detection',
        description: 'It\'s not just up or down. Sites responding over 15 seconds are flagged as slow — before they fully fall over.',
    },
];

const steps = [
    { number: '01', title: 'Create an account', description: 'Sign up for free in seconds. No credit card required.' },
    { number: '02', title: 'Add a monitor', description: 'Enter your URL, pick your check frequency, and you\'re live.' },
    { number: '03', title: 'Stay informed', description: 'Receive instant email alerts and view detailed uptime history.' },
];

export default function Home() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Head title="VOiD Uptime — Website Monitoring" />
            <AppHeader />

            <main className="flex-1">
                {/* Hero */}
                <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/40 px-4 py-1.5 text-sm font-medium text-indigo-100 mb-6">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-400"></span>
                            Self-hosted uptime monitoring
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            Know the moment your
                            <br />
                            <span className="text-indigo-200">website goes down</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-indigo-200 max-w-2xl mx-auto mb-10">
                            VOiD Uptime monitors your websites every minute and sends instant email alerts when something goes wrong — so you can fix it before your customers notice.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href={route('login')}
                                className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg bg-white px-8 py-3 text-base font-semibold text-indigo-700 hover:bg-indigo-50 shadow-lg transition"
                            >
                                Start monitoring free
                            </Link>
                            <a
                                href="#how-it-works"
                                className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-indigo-400 px-8 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition"
                            >
                                See how it works
                            </a>
                        </div>
                    </div>
                </section>

                {/* Social proof bar */}
                <section className="bg-indigo-50 border-y border-indigo-100">
                    <div className="mx-auto max-w-5xl px-4 py-5 flex flex-wrap justify-center gap-8 text-sm text-indigo-700 font-medium">
                        <span>✓ Monitor every 60 seconds</span>
                        <span>✓ Instant email alerts</span>
                        <span>✓ 4-year history</span>
                        <span>✓ Team sharing</span>
                    </div>
                </section>

                {/* Features */}
                <section className="py-24 bg-white">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                Everything you need to stay on top of uptime
                            </h2>
                            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                                Purpose-built monitoring without the bloat — exactly what you need, nothing you don't.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature) => (
                                <div key={feature.title} className="rounded-xl border border-gray-100 bg-gray-50 p-6 hover:shadow-md transition">
                                    <div className="inline-flex items-center justify-center rounded-lg bg-indigo-100 p-2 text-indigo-600 mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section id="how-it-works" className="py-24 bg-gray-50 border-t border-gray-100">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Up and running in minutes</h2>
                            <p className="mt-4 text-lg text-gray-500">Three steps and your first monitor is live.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {steps.map((step, i) => (
                                <div key={step.number} className="relative text-center">
                                    {i < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-indigo-200" />
                                    )}
                                    <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white text-xl font-bold mb-4 shadow-lg">
                                        {step.number}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                                    <p className="text-gray-500 text-sm">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 bg-indigo-600">
                    <div className="mx-auto max-w-3xl px-4 text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Don't find out your site is down from a customer
                        </h2>
                        <p className="text-indigo-200 text-lg mb-8">
                            Start monitoring in minutes. Free to use, self-hosted, and built to last.
                        </p>
                        <Link
                            href={route('login')}
                            className="inline-flex items-center rounded-lg bg-white px-10 py-4 text-base font-semibold text-indigo-700 hover:bg-indigo-50 shadow-lg transition"
                        >
                            Create your free account
                        </Link>
                    </div>
                </section>
            </main>

            <AppFooter />
        </div>
    );
}
