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

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 shadow-lg rounded-lg overflow-hidden">

                {/* Login — left panel */}
                <div className="bg-white px-8 py-10">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in</h2>

                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-600">{status}</div>
                    )}

                    <form onSubmit={submitLogin} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="login_email" value="Email" />
                            <TextInput
                                id="login_email"
                                type="email"
                                name="email"
                                value={loginForm.data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => loginForm.setData('email', e.target.value)}
                            />
                            <InputError message={loginForm.errors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="login_password" value="Password" />
                            <TextInput
                                id="login_password"
                                type="password"
                                name="password"
                                value={loginForm.data.password}
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                onChange={(e) => loginForm.setData('password', e.target.value)}
                            />
                            <InputError message={loginForm.errors.password} className="mt-2" />
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
                                <span className="text-sm text-gray-600">Remember me</span>
                            </label>

                            {canResetPassword && (
                                <a
                                    href={route('password.request')}
                                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    Forgot password?
                                </a>
                            )}
                        </div>

                        <PrimaryButton className="w-full justify-center" disabled={loginForm.processing}>
                            Sign in
                        </PrimaryButton>
                    </form>
                </div>

                {/* Register — right panel */}
                <div className="bg-gray-50 px-8 py-10 border-t md:border-t-0 md:border-l border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Create an account</h2>

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
