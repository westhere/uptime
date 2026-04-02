import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

interface MonitorData {
    id: number;
    name: string;
    url: string;
    frequency_minutes: number;
    is_active: boolean;
}

const FREQUENCY_OPTIONS = [
    { value: 1, label: 'Every 1 minute' },
    { value: 5, label: 'Every 5 minutes' },
    { value: 15, label: 'Every 15 minutes' },
    { value: 30, label: 'Every 30 minutes' },
    { value: 60, label: 'Every hour' },
];

export default function Edit({ monitor }: { monitor: MonitorData }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: monitor.name,
        url: monitor.url,
        frequency_minutes: monitor.frequency_minutes,
        is_active: monitor.is_active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch(route('monitors.update', monitor.id));
    }

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Edit Monitor: {monitor.name}
                </h2>
            }
        >
            <Head title={`Edit ${monitor.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white shadow rounded-lg">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="Monitor Name" />
                                <TextInput
                                    id="name"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
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

                            <div className="flex items-center gap-3">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                />
                                <InputLabel htmlFor="is_active" value="Monitor is active" className="!mb-0" />
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>Save Changes</PrimaryButton>
                                <Link
                                    href={route('monitors.show', monitor.id)}
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                >
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
