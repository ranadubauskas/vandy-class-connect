'use client';
import { useRouter } from 'next/navigation';
import PocketBase from 'pocketbase';
import { useState } from 'react';

const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const pb = new PocketBase(`${NEXT_PUBLIC_POCKETBASE_URL}`);

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => { 
        e.preventDefault();
        try {
            const authData = await pb.collection('users').authWithPassword(email, password);
            console.log('User logged in:', authData);
            router.push('/home');
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const newUser = await pb.collection('users').create({ email, password });
            console.log('User registered:', newUser);
            router.push('/register');
        } catch (err) {
            setError('Registration failed. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h1 className="text-2xl font-bold mb-6 text-center">
                    {isRegistering ? 'Register' : 'Login'}
                </h1>
                <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
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
                        {isRegistering ? 'Register' : 'Login'}
                    </button>
                </form>
                {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
                <p className="mt-4 text-center">
                    {isRegistering ? (
                        <span>
                            Already have an account?{' '}
                            <button
                                onClick={() => setIsRegistering(false)}
                                className="text-blue-500 hover:underline"
                            >
                                Login
                            </button>
                        </span>
                    ) : (
                        <span>
                             Don't have an account?{' '} 
                            <button
                                onClick={() => setIsRegistering(true)}
                                className="text-blue-500 hover:underline"
                            >
                                Register
                            </button>
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}