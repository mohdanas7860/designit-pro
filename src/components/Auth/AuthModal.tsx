import React, { useState } from 'react';
import api from '@/lib/api';
import { X, Loader2 } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Strict email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email format.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Yahan /signin ki jagah /login aur /signup ki jagah /register kar diya hai
            const endpoint = isLogin ? '/login' : '/register';
            const payload = isLogin ? { email, password } : { email, password, name };

            const { data } = await api.post(endpoint, payload);

            localStorage.setItem('designit_token', data.token);
            localStorage.setItem('designit_user', JSON.stringify(data.user));
            onLoginSuccess(data.user);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#121216] border border-zinc-800 w-full max-w-sm p-6 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in-95">
                <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-white transition">
                    <X size={18} />
                </button>

                <h2 className="text-xl font-bold text-white mb-1">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="text-xs text-zinc-400 mb-5">{isLogin ? 'Login to access your projects.' : 'Sign up to start saving your designs.'}</p>

                {error && <div className="mb-4 p-2 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Full Name</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#1a1a22] border border-[#262633] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-zinc-200 transition" placeholder="John Doe" />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Email Address</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#1a1a22] border border-[#262633] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-zinc-200 transition" placeholder="john@example.com" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Password</label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#1a1a22] border border-[#262633] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-zinc-200 transition" placeholder="••••••••" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>

                <div className="mt-5 text-center text-xs text-zinc-500">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
                        {isLogin ? 'Sign up' : 'Login'}
                    </button>
                </div>
            </div>
        </div>
    );
}