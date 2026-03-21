import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { Hexagon } from 'lucide-react';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/auth/register', { name, email, password });
            login(response.data.token, response.data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <Hexagon className="mx-auto h-12 w-12 text-blue-500" />
                    <h2 className="mt-6 text-3xl font-extrabold text-white">Create your account</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-400">Sign in</Link>
                    </p>
                </div>

                <form className="bg-slate-900 shadow-xl rounded-xl px-8 pt-8 pb-8 border border-slate-800" onSubmit={handleRegister}>
                    {error && <div className="mb-4 text-sm text-red-400 bg-red-900/30 p-3 rounded">{error}</div>}
                    <div className="mb-4">
                        <label className="block text-slate-300 text-sm font-bold mb-2">Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            value={name} onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-slate-300 text-sm font-bold mb-2">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            value={email} onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-slate-300 text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            value={password} onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        Create Account
                    </button>
                </form>
            </div>
        </div>
    );
}
