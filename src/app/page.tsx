'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import AuthModal from '@/components/Auth/AuthModal';

const CanvasEditor = dynamic(
  () => import('@/components/Editor/CanvasEditor'),
  { ssr: false }
);

export default function Home() {
  const [showEditor, setShowEditor] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name?: string; email?: string } | null>(null);

  useEffect(() => {
    // Check auth state on load
    const token = localStorage.getItem('designit_token');
    const storedUser = localStorage.getItem('designit_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setShowEditor(true);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleOpenEditor = () => {
    const token = localStorage.getItem('designit_token');
    if (token) {
      setShowEditor(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthModalOpen(false);
    setShowEditor(true);
  };

  if (showEditor) {
    return (
      <main className="min-h-screen">
        <CanvasEditor />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0e0e11] text-zinc-300 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-20 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 text-lg">
              D
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">DesignIt <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Pro</span></h1>
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                <span className="text-sm text-zinc-400">Welcome, <span className="text-white font-medium">{user.name || user.email}</span></span>
                <div className="w-px h-4 bg-white/10"></div>
                <button
                  onClick={() => {
                    localStorage.removeItem('designit_token');
                    localStorage.removeItem('designit_user');
                    setUser(null);
                    setShowEditor(false);
                  }}
                  className="text-xs font-bold text-zinc-400 hover:text-red-400 transition"
                >
                  SIGN OUT
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">What will you design today?</h2>
          <p className="text-lg text-zinc-500 max-w-xl">Create beautiful designs effortlessly. Pick a template or start from scratch.</p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 xl:gap-8 animate-in fade-in duration-1000 delay-150 fill-mode-both">

          {/* Create New Card */}
          <button
            onClick={handleOpenEditor}
            className="group flex flex-col justify-end p-6 aspect-[4/5] bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-125 transition-transform duration-500 ease-out shadow-inner shadow-white/20">
              <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-white font-bold text-lg text-left relative z-10 leading-tight">Start from<br />Scratch</h3>
            <p className="text-indigo-100/70 text-xs text-left relative z-10 mt-1 font-medium tracking-wide">CUSTOM DIMENSIONS</p>
          </button>

          {/* Dummy Template Cards */}
          {[
            { title: 'Instagram Post', desc: '1080 × 1080px', color: 'from-zinc-800 to-zinc-900', img: 'bg-indigo-500/10' },
            { title: 'YouTube Thumb', desc: '1280 × 720px', color: 'from-zinc-800 to-zinc-900', img: 'bg-emerald-500/10' },
            { title: 'Presentation', desc: '1920 × 1080px', color: 'from-zinc-800 to-zinc-900', img: 'bg-rose-500/10' },
            { title: 'A4 Document', desc: '210 × 297mm', color: 'from-zinc-800 to-zinc-900', img: 'bg-sky-500/10' },
          ].map((tpl, i) => (
            <button
              key={i}
              onClick={handleOpenEditor}
              className="group flex flex-col justify-end p-6 aspect-[4/5] bg-[#16161c] border border-[#262633] rounded-3xl hover:-translate-y-1.5 hover:border-zinc-700 hover:bg-[#1a1a22] transition-all duration-300 relative overflow-hidden text-left shadow-lg shadow-black/20"
            >
              <div className="absolute inset-0 p-5 pb-20">
                <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${tpl.color} border border-zinc-700/30 ${tpl.img} group-hover:scale-105 transition-transform duration-500 overflow-hidden relative`}>
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
              <h3 className="text-zinc-200 font-bold text-base relative z-10 group-hover:text-white transition-colors">{tpl.title}</h3>
              <p className="text-zinc-500 text-[11px] font-medium tracking-wide relative z-10 mt-1">{tpl.desc}</p>
            </button>
          ))}

        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </main>
  );
}