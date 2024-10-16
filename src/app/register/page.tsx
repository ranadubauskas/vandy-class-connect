'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import NavBar from '../components/NavBar';
import { register } from '../server';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, index) => currentYear + index);


export default function Register() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [graduationYear, setGraduationYear] = useState(''); // Adjusted field name to match 'year'
    const [error, setError] = useState('');
    const router = useRouter();



    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('passwordConfirm', passwordConfirm);
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            formData.append('graduationYear', graduationYear);
            const user = await register(formData);
            console.log('User registered:', user);
            router.push('/home');
        } catch (err) {
            console.log(err);
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen p-6">
            <NavBar />
            <h1 className="text-3xl font-bold mb-6 text-center text-white"> {'Register'} </h1>
            <div className="w-full max-w-sm mx-auto bg-transparent">
                <form onSubmit={handleRegister} className="space-y-4">
                    <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="email"
                        placeholder="Vanderbilt Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
                    >
                        <option value="" disabled className="text-gray-500">Select Graduation Year</option>
                        {years.map(year => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition duration-300"
                    >
                        Register
                    </button>
                </form>
                {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
                <p className="mt-4 text-center">
                    <span>
                        Already have an account?
                        <a href="/login" className="text-blue-500 hover:underline"> Login </a>
                    </span>
                </p>
            </div>
        </div>
    );
}