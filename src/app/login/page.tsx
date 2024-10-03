'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import NavBar from '../components/NavBar';
import { signIn } from '../server';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            const user = await signIn(formData);
            console.log('User logged in:', user);
            router.push('/home');
        } catch (err) {
            console.error('err occurred: ' + err);
            setError('Login failed. Please check your credentials.');
        }
    };

    return (
        <div
            className="min-h-screen p-6"
            style={{
                background: `linear-gradient(
                            0deg, 
                            #C8D2F9 0%, 
                            #7594A4 50%, 
                            #84969F 79%, 
                            #999999 100%)`,
            }}
        >
            <NavBar />
            <h1 className="text-3xl font-bold mb-6 text-center text-white"> {'Login'} </h1>
            <div className="w-full max-w-sm mx-auto bg-transparent">
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
                        {'Login'}
                    </button>
                </form>
                {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
                <p className="mt-4 text-center text-white">
                    <span>
                        Don't have an account?
                        <a
                            href="/register"
                            className="text-blue-500 hover:underline"
                        >  Register </a>

                    </span>
                </p>
            </div>
        </div>
    );
}
