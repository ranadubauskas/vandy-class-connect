'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../lib/contexts';
import { signIn } from '../server';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { loginUser } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            const user = await signIn(formData);
            loginUser(user);
            router.push('/home');
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen p-6 sm:p-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-white">Login</h1>
            <div className="w-full max-w-md mx-auto bg-transparent">
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition duration-300"
                    >
                        Login
                    </button>
                </form>
                {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
                <p className="mt-4 text-center text-white">
                    Don’t have an account?{' '}
                    <a href="/register" className="text-blue-400 hover:underline">
                        Register
                    </a>
                </p>
            </div>
        </div>
    );
}