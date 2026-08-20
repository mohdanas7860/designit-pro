'use client';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Download, Scan, Info, Brush, LayoutTemplate, Palette, Layers } from 'lucide-react';

const CATEGORY_MAP: Record<string, { title: string; color: string; desc: string }> = {
    templates: { title: 'All Templates', color: 'bg-purple-500', desc: 'Browse the entire premium collection.' },
    presentation: { title: 'Presentations', color: 'bg-indigo-500', desc: 'High-impact slide decks for powerful pitches.' },
    social: { title: 'Social Media', color: 'bg-pink-500', desc: 'Engaging content optimized for top networks.' },
    video: { title: 'Video Elements', color: 'bg-blue-500', desc: 'Cinematic covers and overlays.' },
    print: { title: 'Print Shop', color: 'bg-emerald-500', desc: 'Crystal clear CMYK ready graphics.' },
    doc: { title: 'Documents', color: 'bg-sky-500', desc: 'Resumes, letters, and portfolios.' },
    whiteboard: { title: 'Whiteboards', color: 'bg-amber-500', desc: 'Infinite expanses for team brainstorming.' },
    website: { title: 'Websites', color: 'bg-teal-500', desc: 'Modern wireframes and high-fidelity mockups.' }
};

const TEMPLATES = [
    // Social
    { id: 1, title: 'Neon Cyber Promo', category: 'social', dim: '1080 x 1080 px', pages: 1, format: 'PNG/JPG', img: 'https://images.unsplash.com/photo-1558470598-a5dda9640f68?q=80&w=600&auto=format&fit=crop' },
    { id: 101, title: 'Minimal Instagram Story', category: 'social', dim: '1080 x 1920 px', pages: 3, format: 'PNG/JPG', img: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=600&auto=format&fit=crop' },
    // Website
    { id: 2, title: 'Abstract Portfolio', category: 'website', dim: '1920 x 1080 px', pages: 5, format: 'PDF/PNG', img: 'https://images.unsplash.com/photo-1618005192384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop' },
    { id: 102, title: 'E-commerce Landing', category: 'website', dim: '1440 x 3200 px', pages: 1, format: 'Figma/PNG', img: 'https://images.unsplash.com/photo-1507238692062-5a042e9eec62?q=80&w=600&auto=format&fit=crop' },
    // Doc
    { id: 3, title: 'Minimalist Travel', category: 'doc', dim: '8.5 x 11 in', pages: 3, format: 'PDF', img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop' },
    { id: 7, title: 'Professional Resume', category: 'doc', dim: 'A4', pages: 2, format: 'PDF', img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop' },
    // Presentation
    { id: 4, title: 'Modern Startup Deck', category: 'presentation', dim: '1920 x 1080 px', pages: 12, format: 'PPTX/PDF', img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop' },
    { id: 104, title: 'Quarterly Review', category: 'presentation', dim: '1920 x 1080 px', pages: 15, format: 'PPTX/PDF', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop' },
    // Print
    { id: 5, title: 'Fashion Lookbook', category: 'print', dim: '18 x 24 in', pages: 1, format: 'PDF/CMYK', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop' },
    { id: 8, title: 'Indie Concert Poster', category: 'print', dim: '24 x 36 in', pages: 1, format: 'PDF', img: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=600&auto=format&fit=crop' },
    // Video
    { id: 6, title: 'Cinematic Video Cover', category: 'video', dim: '1280 x 720 px', pages: 1, format: 'JPG', img: 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?q=80&w=600&auto=format&fit=crop' },
    { id: 106, title: 'YouTube End Screen', category: 'video', dim: '1920 x 1080 px', pages: 1, format: 'MP4/JPG', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop' },
    // Whiteboard
    { id: 107, title: 'Brainstorming Mindmap', category: 'whiteboard', dim: 'Infinite Space', pages: 1, format: 'PNG', img: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop' },
    { id: 108, title: 'Agile Sprint Board', category: 'whiteboard', dim: 'Infinite Space', pages: 1, format: 'PNG', img: 'https://images.unsplash.com/photo-1512758684632-4fb8e578c205?q=80&w=600&auto=format&fit=crop' },
];

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    // We use React `use` for unwrapping next 14+ params if it's dynamic/async in recent next versions.
    const { slug } = use(params);
    const catInfo = CATEGORY_MAP[slug] || { title: 'Design Templates', color: 'bg-violet-500', desc: 'Explore exclusive high-fidelity designs.' };

    const [activeTemplate, setActiveTemplate] = useState<any | null>(null);
    const [selectedSize, setSelectedSize] = useState('Default');
    const [selectedQty, setSelectedQty] = useState('1');

    // Filter templates. If 'templates' is slug, show all. Otherwise filter by category.
    const filteredTemplates = slug === 'templates' ? TEMPLATES : TEMPLATES.filter(t => t.category === slug);
    const displayTemplates = filteredTemplates; // removed fallback

    return (
        <main className="min-h-screen bg-[#0c0c0e] text-white selection:bg-violet-500/30 overflow-x-hidden font-sans pt-6 relative">
            {/* Background Ambient Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-violet-600/10 via-purple-900/5 to-transparent blur-[120px] pointer-events-none mix-blend-screen z-0"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 pb-20">

                {/* Navigation & Header */}
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 font-medium text-sm group"
                >
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 group-hover:border-zinc-700 transition-all">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                    Back to Dashboard
                </button>

                <div className="mb-12 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-3 h-10 ${catInfo.color} rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]`}></div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{catInfo.title}</h1>
                    </div>
                    <p className="text-zinc-400 text-lg">{catInfo.desc} Displaying {displayTemplates.length} assets.</p>
                </div>

                {/* Gallery Grid */}
                {displayTemplates.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center">
                        <LayoutTemplate className="w-16 h-16 text-zinc-700 mb-4" />
                        <h2 className="text-2xl font-bold text-zinc-400">No templates found</h2>
                        <p className="text-zinc-600 mt-2">Check back later for new {catInfo.title} designs.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {displayTemplates.map((tpl) => (
                            <button
                                key={tpl.id}
                                onClick={() => setActiveTemplate(tpl)}
                                className="group relative w-full aspect-[4/5] bg-zinc-900 border border-zinc-800/80 rounded-[2rem] overflow-hidden hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0c0c0e]"
                            >
                                <img src={tpl.img} alt={tpl.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-violet-300 border border-white/10 uppercase tracking-widest">{tpl.category}</span>
                                </div>

                                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end">
                                    <h3 className="font-bold text-xl text-white mb-1 drop-shadow-lg">{tpl.title}</h3>
                                    <p className="text-zinc-300 text-xs font-semibold drop-shadow">{tpl.dim}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Template Preview Overlay (Canva Style) */}
            {activeTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div onClick={() => setActiveTemplate(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"></div>

                    <div className="relative w-full max-w-5xl bg-[#18181b] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Left side: Premium Image Showcase & Alternative Thumbnails */}
                        <div className="md:w-[55%] relative shrink-0 flex flex-col bg-[#111118]">
                            <div className="flex-1 relative overflow-hidden">
                                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                                <img src={activeTemplate.img} alt={activeTemplate.title} className="w-full h-full object-contain relative z-10 p-4" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#18181b]/20 md:to-[#18181b] z-20 pointer-events-none"></div>
                            </div>

                            {/* Canva Style Thumbnail Picker */}
                            <div className="h-24 bg-[#0a0a0f] border-t border-zinc-800/80 flex items-center gap-3 px-6 shrink-0 overflow-x-auto">
                                <div className="w-16 h-16 rounded-lg border-2 border-violet-500 overflow-hidden shrink-0 cursor-pointer relative">
                                    <img src={activeTemplate.img} className="w-full h-full object-cover" alt="Main Thumb" />
                                </div>
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="w-16 h-16 rounded-lg border border-zinc-700 hover:border-zinc-500 opacity-50 hover:opacity-100 transition-all overflow-hidden shrink-0 cursor-pointer">
                                        <img src={activeTemplate.img} className="w-full h-full object-cover" alt={`Thumb ${i + 2}`} style={{ filter: `hue-rotate(${i * 60}deg)` }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right side: Template Specifications and CTA */}
                        <div className="p-8 md:p-10 md:w-[45%] flex flex-col justify-center relative z-20">
                            <div className="flex items-center gap-2 text-violet-400 font-bold uppercase tracking-widest text-xs mb-4">
                                <LayoutTemplate className="w-4 h-4" /> Professional Template
                            </div>

                            <h2 className="text-3xl font-black text-white mb-4 tracking-tight leading-tight">{activeTemplate.title}</h2>
                            <p className="text-zinc-400 mb-6 text-sm leading-relaxed">Fully customizable starting point. Replace the imagery, update typography, and apply your personal brand color systems instantly.</p>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-zinc-800/50 rounded-xl text-zinc-300 border border-zinc-700/50"><Scan size={18} /></div>
                                    <div><p className="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Dimensions</p><p className="text-sm font-semibold text-zinc-200">{activeTemplate.dim}</p></div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-zinc-800/50 rounded-xl text-zinc-300 border border-zinc-700/50"><Layers className="w-4 h-4" /></div>
                                    <div><p className="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Pages</p><p className="text-sm font-semibold text-zinc-200">{activeTemplate.pages}</p></div>
                                </div>
                            </div>

                            {/* Selection Dropdowns for Size & Quality */}
                            <div className="space-y-4 mb-6 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-zinc-500 mb-2 block tracking-wider">Select Size</label>
                                    <select
                                        value={selectedSize}
                                        onChange={(e) => setSelectedSize(e.target.value)}
                                        className="w-full bg-[#111118] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:border-violet-500 outline-none transition-colors"
                                    >
                                        <option value="Default">{activeTemplate.dim} (Default)</option>
                                        <option value="A4">A4 (210 x 297 mm)</option>
                                        <option value="A3">A3 (297 x 420 mm)</option>
                                        <option value="A2">A2 (420 x 594 mm)</option>
                                        <option value="IG">Instagram Post (1080x1080)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-zinc-500 mb-2 block tracking-wider">How many? (Quantity)</label>
                                    <select
                                        value={selectedQty}
                                        onChange={(e) => setSelectedQty(e.target.value)}
                                        className="w-full bg-[#111118] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:border-violet-500 outline-none transition-colors"
                                    >
                                        <option value="1">1 (Digital Download)</option>
                                        <option value="50">50 Copies (Print Delivery)</option>
                                        <option value="100">100 Copies (Print Delivery)</option>
                                        <option value="500">500 Copies (Print Delivery)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-auto flex gap-3">
                                <button
                                    onClick={() => router.push(`/dashboard/editor?templateImg=${encodeURIComponent(activeTemplate.img)}&size=${selectedSize}`)}
                                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] shadow-[0_10px_30px_-10px_rgba(139,92,246,0.6)] flex items-center justify-center gap-2 text-lg group"
                                >
                                    <Brush className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Customise this template
                                </button>
                            </div>
                        </div>

                        <button onClick={() => setActiveTemplate(null)} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors z-50">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
