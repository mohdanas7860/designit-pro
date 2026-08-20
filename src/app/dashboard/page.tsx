'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Plus, Search, LayoutTemplate, Presentation,
  Share2, Video, Printer, FileText, Monitor,
  Globe, Wand2, Upload, ChevronRight, Sparkles, Image as ImageIcon, Scissors
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/Auth/AuthModal';

const CATEGORIES = [
  { icon: LayoutTemplate, label: 'Templates', color: 'text-purple-400', bg: 'bg-purple-500/10', slug: 'templates' },
  { icon: Scissors, label: 'Passport Studio', color: 'text-emerald-400', bg: 'bg-emerald-500/10', slug: 'passport' },
  { icon: Presentation, label: 'Presentation', color: 'text-indigo-400', bg: 'bg-indigo-500/10', slug: 'presentation' },
  { icon: Share2, label: 'Social Media', color: 'text-pink-400', bg: 'bg-pink-500/10', slug: 'social' },
  { icon: Video, label: 'Video', color: 'text-blue-400', bg: 'bg-blue-500/10', slug: 'video' },
  { icon: Printer, label: 'Print Shop', color: 'text-teal-400', bg: 'bg-teal-500/10', slug: 'print' },
  { icon: FileText, label: 'Doc', color: 'text-sky-400', bg: 'bg-sky-500/10', slug: 'doc' },
  { icon: Monitor, label: 'Whiteboard', color: 'text-amber-400', bg: 'bg-amber-500/10', slug: 'whiteboard' },
  { icon: Globe, label: 'Website', color: 'text-cyan-400', bg: 'bg-cyan-500/10', slug: 'website' },
  { icon: Wand2, label: 'Custom Size', color: 'text-violet-400', bg: 'bg-violet-500/10', slug: 'editor' },
];

export default function Home() {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name?: string; email?: string } | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('designit_token');
    const storedUser = localStorage.getItem('designit_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleNavigation = (route: string) => {
    const token = localStorage.getItem('designit_token');
    if (token) {
      if (route === 'editor' || route === 'passport') {
        router.push(`/dashboard/${route}`);
      } else {
        router.push(`/dashboard/category/${route}`);
      }
    } else {
      setPendingRoute(route);
      setIsAuthModalOpen(true);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthModalOpen(false);
    if (pendingRoute) {
      if (pendingRoute === 'editor' || pendingRoute === 'passport') {
        router.push(`/dashboard/${pendingRoute}`);
      } else {
        router.push(`/dashboard/category/${pendingRoute}`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('designit_token');
    localStorage.removeItem('designit_user');
    setUser(null);
    router.push('/');
  };

  return (
    <main className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-slate-950 via-indigo-950/40 to-black text-zinc-300 selection:bg-purple-500/30 font-sans">

      {/* High-end Canvas-like Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex justify-center">
        {/* Core ambient violet/indigo glow */}
        <div className="absolute top-0 w-full max-w-6xl h-[700px] bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-indigo-600/20 via-purple-800/10 to-transparent blur-[120px] mix-blend-screen"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-transparent blur-[150px]"></div>
      </div>

      <div className="relative z-10 w-full">
        {/* Header */}
        <header className="flex justify-between items-center px-6 md:px-8 py-5 animate-in fade-in slide-in-from-top-4 duration-500 border-b border-white/5 bg-transparent backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] text-lg border border-white/20">
              D
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">DesignIt <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Pro</span></h1>
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-lg backdrop-blur-md">
                <span className="text-sm text-zinc-300 hidden md:block">Welcome, <span className="text-white font-bold">{user.name || user.email}</span></span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 ml-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 font-semibold text-sm rounded-full transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-2.5 text-sm font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition shadow-lg backdrop-blur-sm hover:shadow-white/5 hover:border-white/20"
              >
                Log In / Sign Up
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Main Content Area */}
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-12 md:py-16">

          {/* Main Hero & Search Area */}
          <div className="flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight leading-tight drop-shadow-2xl">
              What will you <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 drop-shadow-sm">design today?</span>
            </h2>

            {/* Professional Search Bar */}
            <div className="w-full relative group shadow-[0_0_40px_-15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_-10px_rgba(139,92,246,0.4)] transition-all duration-500 rounded-full">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-zinc-400 group-focus-within:text-violet-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search your content or Canva's template library..."
                className="block w-full pl-16 pr-6 py-5 bg-white/5 border-2 border-white/10 rounded-full leading-5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-0 focus:border-violet-500/50 focus:bg-white/10 transition-all text-lg backdrop-blur-xl"
              />
              <button
                onClick={() => handleNavigation('editor')}
                className="absolute inset-y-2 right-2 px-6 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Start
              </button>
            </div>

            {/* Quick Categories Bar */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-10">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => handleNavigation(cat.slug)}
                  className="group flex flex-col items-center gap-2 w-[88px] hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className={`w-14 h-14 ${cat.bg} rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-${cat.color.split('-')[1]}-500/40 relative overflow-hidden group-hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]`}>
                    <cat.icon className={`w-6 h-6 ${cat.color}`} strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 text-center leading-tight">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Templates for you */}
          <div className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Templates for you</h3>
              <button className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                See all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Wide Banners */}
              {[
                { title: 'Cinematic Video Covers', subtitle: '4K ready templates', button: 'Edit Video Cover', category: 'video', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop', align: 'items-start' },
                { title: 'Electronic Music Festival', subtitle: 'Print-ready A3 posters', button: 'Customize Poster', category: 'print', img: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=1200&auto=format&fit=crop', align: 'items-center text-center' },
                { title: 'AI Automation Guide', subtitle: 'Pro visual documents', button: 'Create Document', category: 'doc', img: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop', align: 'items-end text-right' }
              ].map((banner, i) => (
                <button
                  key={i}
                  onClick={() => handleNavigation(banner.category)}
                  className="group relative h-64 md:h-80 w-full rounded-[2rem] overflow-hidden border border-white/10 hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-500"
                >
                  <img src={banner.img} alt={banner.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                  <div className={`absolute inset-0 p-8 flex flex-col justify-end ${banner.align}`}>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-zinc-200 mb-3 border border-white/10">Pro Template</span>
                    <h4 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-1 leading-tight">{banner.title}</h4>
                    <p className="text-zinc-300 text-sm font-semibold mb-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{banner.subtitle}</p>
                    <div className="px-5 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-sm hover:bg-violet-50 transition-colors shadow-xl">
                      {banner.button}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section: See what's new (Slider style using CSS scroll) */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">See what&apos;s new</h3>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none' }}>
              {[
                { title: 'Neon Cyber Promo', tag: 'Social', category: 'social', img: 'https://images.unsplash.com/photo-1558470598-a5dda9640f68?q=80&w=600&auto=format&fit=crop' },
                { title: 'Abstract Portfolio', tag: 'Website', category: 'website', img: 'https://images.unsplash.com/photo-1618005192384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop' },
                { title: 'Minimalist Travel', tag: 'Document', category: 'doc', img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop' },
                { title: 'Modern Startup Deck', tag: 'Presentation', category: 'presentation', img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop' },
                { title: 'Fashion Lookbook', tag: 'Print', category: 'print', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop' },
              ].map((card, i) => (
                <button
                  key={i}
                  onClick={() => handleNavigation(card.category)}
                  className="group flex-none w-[280px] md:w-[320px] rounded-3xl bg-zinc-900 border border-white/10 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all duration-300 relative overflow-hidden snap-start text-left"
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img src={card.img} alt={card.title} className="w-full h-full object-cover opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" />
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">{card.tag}</span>
                    <h4 className="text-lg font-bold text-white mt-1 group-hover:text-violet-200 transition-colors">{card.title}</h4>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Browse template categories */}
          <div className="mb-20">
            <h3 className="text-2xl font-bold text-white tracking-tight mb-6 drop-shadow-md">Browse by category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { name: 'Presentation', slug: 'presentation', icon: Presentation, color: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30 text-orange-200' },
                { name: 'Poster', slug: 'print', icon: ImageIcon, color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30 text-blue-200' },
                { name: 'CV / Resume', slug: 'doc', icon: FileText, color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30 text-emerald-200' },
                { name: 'Social Post', slug: 'social', icon: Share2, color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30 text-pink-200' },
                { name: 'Invitation', slug: 'print', icon: Sparkles, color: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30 text-purple-200' },
                { name: 'Link in Bio', slug: 'website', icon: Globe, color: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/30 text-indigo-200' },
                { name: 'Logo', slug: 'design', icon: LayoutTemplate, color: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30 text-amber-200' },
              ].map((category, i) => (
                <button
                  key={i}
                  onClick={() => handleNavigation(category.slug)}
                  className={`group relative p-6 rounded-3xl bg-gradient-to-br ${category.color} border ${category.border} hover:bg-white/10 transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]`}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 rounded-3xl transition-colors z-0"></div>
                  <category.icon className="w-8 h-8 relative z-10 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" strokeWidth={1.5} />
                  <span className="font-semibold text-sm relative z-10">{category.name}</span>
                </button>
              ))}
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