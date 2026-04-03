import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

const FREQUENCY_OPTIONS = [
    { value: 1, label: 'Every 1 minute' },
    { value: 5, label: 'Every 5 minutes' },
    { value: 15, label: 'Every 15 minutes' },
    { value: 30, label: 'Every 30 minutes' },
    { value: 60, label: 'Every hour' },
];

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        url: '',
        frequency_minutes: 5,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('monitors.store'));
    }

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">Add Monitor</h2>
            }
        >
            <Head title="Add Monitor" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <p className="text-sm text-gray-500">Enter your site details and check frequency below.</p>
                        </div>
                        <form onSubmit={submit} className="p-6 space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="Monitor Name" />
                                <TextInput
                                    id="name"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="My Website"
                                    required
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="url" value="URL" />
                                <TextInput
                                    id="url"
                                    type="url"
                                    className="mt-1 block w-full"
                                    value={data.url}
                                    onChange={(e) => setData('url', e.target.value)}
                                    placeholder="https://example.com"
                                    required
                                />
                                <InputError message={errors.url} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="frequency_minutes" value="Check Frequency" />
                                <select
                                    id="frequency_minutes"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.frequency_minutes}
                                    onChange={(e) => setData('frequency_minutes', Number(e.target.value))}
                                >
                                    {FREQUENCY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.frequency_minutes} className="mt-1" />
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>Create Monitor</PrimaryButton>
                                <Link href={route('dashboard')} className="text-sm text-gray-600 hover:text-gray-900">
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
