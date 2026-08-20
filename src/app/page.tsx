'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Zap, LayoutTemplate, MousePointer2 } from 'lucide-react';
import AuthModal from '@/components/Auth/AuthModal';

export default function Home() {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name?: string; email?: string } | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    // Check auth state on load
    const token = localStorage.getItem('designit_token');
    const storedUser = localStorage.getItem('designit_user');
    if (token && storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        // If they visit the root actively logged in, route them to dashboard.
        router.push('/dashboard');
      } catch (e) {
        console.error(e);
      }
    }
  }, [router]);

  const handleOpenEditor = () => {
    const token = localStorage.getItem('designit_token');
    if (token) {
      router.push('/dashboard');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthModalOpen(false);
    router.push('/dashboard');
  };

  // We do not render CanvasEditor here anymore. They must go to /dashboard. 
  // We keep the return statement clean and vibrant.

  return (
    <main className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-slate-950 via-indigo-950/40 to-black text-zinc-300 selection:bg-purple-500/30">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex justify-center">
        {/* Deep rich purple top glow */}
        <div className="absolute top-0 w-full max-w-4xl h-[600px] bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-fuchsia-600/30 via-purple-800/10 to-transparent blur-[100px] opacity-80 mix-blend-screen"></div>
        {/* Subtle grid mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-75"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-24 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] text-lg">
              D
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">DesignIt <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Pro</span></h1>
          </div>

          <div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-2.5 text-sm font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition shadow-lg backdrop-blur-sm hover:shadow-white/5 hover:border-white/20"
            >
              Sign In
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="mb-14 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-400/40 text-sm font-bold text-fuchsia-100 mb-8 backdrop-blur-lg shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105 transition-transform">
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse shadow-[0_0_10px_rgba(217,70,239,0.8)]"></span>
            ✨ Powered by Next-Gen AI & Pro Tools
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight drop-shadow-2xl">
            What will you <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 drop-shadow-sm">design today?</span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-300 font-medium leading-relaxed max-w-2xl drop-shadow-md">
            Bring your creative vision to life with professional-grade tools.
            Choose a premium template to jumpstart your workflow or start from a blank canvas.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 xl:gap-8 animate-in fade-in duration-1000 delay-150 fill-mode-both">
          {/* Create New Card */}
          <button
            onClick={handleOpenEditor}
            className="group flex flex-col justify-end p-6 aspect-[4/5] bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 relative overflow-hidden text-left border border-white/10 hover:border-white/30"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-125 transition-transform duration-500 ease-out shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <Plus className="w-8 h-8 text-white drop-shadow" strokeWidth={2.5} />
            </div>
            <h3 className="text-white font-black text-lg text-left relative z-10 leading-tight drop-shadow-sm">Start from<br />Scratch</h3>
            <p className="text-indigo-100/90 text-xs text-left relative z-10 mt-1 font-bold tracking-wide">CUSTOM DIMENSIONS</p>
          </button>

          {/* New Template Cards */}
          {[
            { title: 'YouTube Thumb', desc: 'Video Cover', dim: '1280 × 720px', img: 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?q=80&w=600&auto=format&fit=crop' },
            { title: 'Instagram Post', desc: 'Social Media', dim: '1080 × 1080px', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop' },
            { title: 'Professional Poster', desc: 'Print Ready', dim: '18 × 24 in', img: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop' },
            { title: 'Logo Design', desc: 'Brand Identity', dim: '500 × 500px', img: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop' },
          ].map((tpl, i) => (
            <div key={i} className="relative z-10">
              <button
                onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                onBlur={() => setTimeout(() => setExpandedCard(null), 200)}
                className="group w-full flex flex-col justify-end p-6 aspect-[4/5] bg-zinc-900/40 rounded-3xl hover:scale-105 transition-all duration-300 relative overflow-hidden text-left shadow-2xl border-2 border-white/5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <div className="absolute inset-0">
                  <img src={tpl.img} alt={tpl.title} className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/30 to-transparent mix-blend-multiply"></div>
                  <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-purple-400/40 transition-colors pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[inset_0_0_20px_rgba(168,85,247,0.3)]"></div>
                </div>
                <h3 className="text-white font-black text-lg relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] group-hover:text-purple-300 transition-colors">{tpl.title}</h3>
                <p className="text-zinc-200 text-xs font-bold tracking-wide relative z-10 mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">{tpl.desc}</p>
              </button>

              {expandedCard === i && (
                <div className="absolute top-[105%] left-0 right-0 p-4 bg-zinc-950/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl z-20 shadow-[0_10px_50px_-10px_rgba(168,85,247,0.4)] animate-in fade-in zoom-in-95 duration-200">
                  <h4 className="text-white font-semibold mb-1 text-sm">{tpl.title}</h4>
                  <p className="text-zinc-300 text-xs mb-3">{tpl.desc} • <span className="text-purple-400 font-bold">{tpl.dim}</span></p>
                  <button
                    onClick={() => setExpandedCard(null)}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/30 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Got It
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Features Section (Why Choose DesignIt Pro?) */}
        <div className="mt-32 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3 drop-shadow-md">Why Choose DesignIt Pro?</h3>
            <p className="text-zinc-400 max-w-xl mx-auto font-medium">Everything you need to create stunning professional graphics in your browser.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-lg hover:bg-zinc-900/60 hover:border-purple-500/30 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/30 shadow-inner">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Lightning Fast Export</h4>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">Instantly download your creative work in ultra-high resolution formats ready for print and absolute digital clarity.</p>
            </div>

            <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-lg hover:bg-zinc-900/60 hover:border-purple-500/30 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] hidden md:block">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30 shadow-inner">
                <LayoutTemplate className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Professional Templates</h4>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">Save countless hours with beautifully crafted templates designed by industry experts, instantly adaptable to your brand.</p>
            </div>

            <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-lg hover:bg-zinc-900/60 hover:border-purple-500/30 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6 border border-pink-500/30 shadow-inner">
                <MousePointer2 className="w-6 h-6 text-pink-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Easy Drag-and-Drop</h4>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">Experience a relentlessly intuitive canvas that empowers your creativity without requiring a steep learning curve.</p>
            </div>
          </div>
        </div>

        {/* Features Section (Why Choose DesignIt Pro?) */}
        <div className="mt-32 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3 drop-shadow-md">Why Choose DesignIt Pro?</h3>
            <p className="text-zinc-400 max-w-xl mx-auto font-medium">Everything you need to create stunning professional graphics in your browser.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-lg hover:bg-zinc-900/60 hover:border-purple-500/30 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/30 shadow-inner">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Lightning Fast Export</h4>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">Instantly download your creative work in ultra-high resolution formats ready for print and absolute digital clarity.</p>
            </div>

            <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-lg hover:bg-zinc-900/60 hover:border-purple-500/30 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] hidden md:block">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30 shadow-inner">
                <LayoutTemplate className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Professional Templates</h4>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">Save countless hours with beautifully crafted templates designed by industry experts, instantly adaptable to your brand.</p>
            </div>

            <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-lg hover:bg-zinc-900/60 hover:border-purple-500/30 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6 border border-pink-500/30 shadow-inner">
                <MousePointer2 className="w-6 h-6 text-pink-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Easy Drag-and-Drop</h4>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">Experience a relentlessly intuitive canvas that empowers your creativity without requiring a steep learning curve.</p>
            </div>
          </div>
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