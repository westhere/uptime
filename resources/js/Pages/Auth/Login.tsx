import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const loginForm = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const registerForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submitLogin: FormEventHandler = (e) => {
        e.preventDefault();
        loginForm.post(route('login'), {
            onFinish: () => loginForm.reset('password'),
        });
    };

    const submitRegister: FormEventHandler = (e) => {
        e.preventDefault();
        registerForm.post(route('register'), {
            onFinish: () => registerForm.reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Sign in" />

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 shadow-xl rounded-2xl overflow-hidden border border-gray-100">

                {/* Login — left panel */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-8 py-10">
                    <div className="mb-8">
                        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/40 px-3 py-1 text-xs font-medium text-indigo-100">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400"></span>
                            VOiD Uptime
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
                    <p className="text-indigo-200 text-sm mb-8">Sign in to your account to continue monitoring.</p>

                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-300">{status}</div>
                    )}

                    <form onSubmit={submitLogin} className="space-y-4">
                        <div>
                            <label htmlFor="login_email" className="block text-sm font-medium text-indigo-100 mb-1">Email</label>
                            <input
                                id="login_email"
                                type="email"
                                name="email"
                                value={loginForm.data.email}
                                autoComplete="username"
                                autoFocus
                                onChange={(e) => loginForm.setData('email', e.target.value)}
                                className="block w-full rounded-lg border-0 bg-indigo-500/40 px-3 py-2 text-white placeholder-indigo-300 shadow-sm ring-1 ring-indigo-400 focus:ring-2 focus:ring-white text-sm"
                                placeholder="you@example.com"
                            />
                            {loginForm.errors.email && <p className="mt-1 text-xs text-red-300">{loginForm.errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="login_password" className="block text-sm font-medium text-indigo-100 mb-1">Password</label>
                            <input
                                id="login_password"
                                type="password"
                                name="password"
                                value={loginForm.data.password}
                                autoComplete="current-password"
                                onChange={(e) => loginForm.setData('password', e.target.value)}
                                className="block w-full rounded-lg border-0 bg-indigo-500/40 px-3 py-2 text-white placeholder-indigo-300 shadow-sm ring-1 ring-indigo-400 focus:ring-2 focus:ring-white text-sm"
                                placeholder="••••••••"
                            />
                            {loginForm.errors.password && <p className="mt-1 text-xs text-red-300">{loginForm.errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    name="remember"
                                    checked={loginForm.data.remember}
                                    onChange={(e) =>
                                        loginForm.setData('remember', (e.target.checked || false) as false)
                                    }
                                />
                                <span className="text-sm text-indigo-200">Remember me</span>
                            </label>

                            {canResetPassword && (
                                <a
                                    href={route('password.request')}
                                    className="text-sm text-indigo-200 hover:text-white underline"
                                >
                                    Forgot password?
                                </a>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loginForm.processing}
                            className="w-full inline-flex justify-center items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 shadow transition disabled:opacity-60"
                        >
                            Sign in
                        </button>
                    </form>
                </div>

                {/* Register — right panel */}
                <div className="bg-white px-8 py-10 border-t md:border-t-0 md:border-l border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Create an account</h2>
                    <p className="text-sm text-gray-500 mb-8">Start monitoring your sites for free.</p>

                    <form onSubmit={submitRegister} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="reg_name" value="Name" />
                            <TextInput
                                id="reg_name"
                                name="name"
                                value={registerForm.data.name}
                                className="mt-1 block w-full"
                                autoComplete="name"
                                onChange={(e) => registerForm.setData('name', e.target.value)}
                                required
                            />
                            <InputError message={registerForm.errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="reg_email" value="Email" />
                            <TextInput
                                id="reg_email"
                                type="email"
                                name="email"
                                value={registerForm.data.email}
                                className="mt-1 block w-full"
                                autoComplete="email"
                                onChange={(e) => registerForm.setData('email', e.target.value)}
                                required
                            />
                            <InputError message={registerForm.errors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="reg_password" value="Password" />
                            <TextInput
                                id="reg_password"
                                type="password"
                                name="password"
                                value={registerForm.data.password}
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                onChange={(e) => registerForm.setData('password', e.target.value)}
                                required
                            />
                            <InputError message={registerForm.errors.password} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="reg_password_confirmation" value="Confirm Password" />
                            <TextInput
                                id="reg_password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={registerForm.data.password_confirmation}
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                onChange={(e) => registerForm.setData('password_confirmation', e.target.value)}
                                required
                            />
                            <InputError message={registerForm.errors.password_confirmation} className="mt-2" />
                        </div>

                        <PrimaryButton className="w-full justify-center" disabled={registerForm.processing}>
                            Create account
                        </PrimaryButton>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
