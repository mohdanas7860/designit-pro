const fs = require('fs');

let c = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

// 1. Dashboard Sub-Routing Tabs & Search
const navUIOld = `<nav className="space-y-2 flex-1">
                        <button className="w-full text-left px-4 py-3 rounded-xl bg-purple-600/20 text-purple-500 font-semibold flex items-center space-x-3"><Home size={18} /><span>Home</span></button>
                        <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-gray-200 font-medium transition-colors flex items-center space-x-3"><LayoutTemplate size={18} /><span>Templates</span></button>
                        <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-gray-200 font-medium transition-colors flex items-center space-x-3"><Folder size={18} /><span>Projects</span></button>
                    </nav>`;

const navUINew = `<nav className="space-y-2 flex-1">
                        <button onClick={() => setDashboardTab('home')} className={\`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center space-x-3 transition-colors \${dashboardTab === 'home' ? 'bg-purple-600/20 text-purple-500' : 'text-zinc-400 hover:bg-zinc-800 hover:text-gray-200'}\`}><Home size={18} /><span>Home</span></button>
                        <button onClick={() => setDashboardTab('templates')} className={\`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center space-x-3 transition-colors \${dashboardTab === 'templates' ? 'bg-purple-600/20 text-purple-500' : 'text-zinc-400 hover:bg-zinc-800 hover:text-gray-200'}\`}><LayoutTemplate size={18} /><span>Templates</span></button>
                        <button onClick={() => setDashboardTab('projects')} className={\`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center space-x-3 transition-colors \${dashboardTab === 'projects' ? 'bg-purple-600/20 text-purple-500' : 'text-zinc-400 hover:bg-zinc-800 hover:text-gray-200'}\`}><Folder size={18} /><span>Projects</span></button>
                    </nav>`;
c = c.replace(navUIOld, navUINew);


// Search Input Bindings
const searchOld = `<input type="text" placeholder="Search your content or templates" className="w-full bg-white text-gray-900 rounded-full py-4 pl-12 pr-4 shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-400/50 transition-all font-medium" />`;
const searchNew = `<input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search templates and presets..." className="w-full bg-white text-gray-900 rounded-full py-4 pl-12 pr-4 shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-400/50 transition-all font-medium" />`;
c = c.replace(searchOld, searchNew);


// Sub-routing main hero unit
const heroOld = `<div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-200">Start new design...</h3>
                            <div className="grid grid-cols-5 gap-6">`;

const heroNew = `<div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-200">{dashboardTab === 'home' ? 'Start new design...' : dashboardTab === 'templates' ? 'Template Gallery' : 'Your Projects'}</h3>
                            {dashboardTab === 'home' && (
                            <div className="grid grid-cols-5 gap-6">`;

c = c.replace(heroOld, heroNew);

const heroCloseOld = `<span className="text-sm font-semibold text-gray-300">Custom Size<br/><span className="text-xs text-zinc-500 font-normal leading-tight">Freeform Layout</span></span>
                                </button>
                            </div>
                        </div>`;
const heroCloseNew = `<span className="text-sm font-semibold text-gray-300">Custom Size<br/><span className="text-xs text-zinc-500 font-normal leading-tight">Freeform Layout</span></span>
                                </button>
                            </div>
                            )}

                            {dashboardTab === 'templates' && (
                                <div className="grid grid-cols-3 gap-6">
                                    {['SaleBanner', 'QuoteCard', 'SocialPromo'].filter(t => t.toLowerCase().includes(searchQuery.toLowerCase())).map((template, idx) => (
                                        <button key={idx} onClick={() => changeSize(1080, 1080)} className="h-48 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-purple-500 overflow-hidden group relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-white opacity-80 group-hover:opacity-100 transition-opacity">{template}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {dashboardTab === 'projects' && (
                                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                                     <Folder size={48} className="text-zinc-700" />
                                     <h3 className="text-2xl font-bold text-zinc-500">No Projects Found</h3>
                                     <p className="text-zinc-600">Saved designs explicitly stored in LocalStorage will appear here.</p>
                                </div>
                            )}
                        </div>`;
c = c.replace(heroCloseOld, heroCloseNew);


// 2. Wrap Canvas & scale it
const viewportOld = `<div className="flex-1 overflow-auto bg-[#09090b] relative w-full h-full p-10 flex">
                        <div className="m-auto ring-1 ring-black/10 shadow-2xl overflow-hidden relative rounded-sm bg-white" style={{ width: canvasWidth, height: canvasHeight }}>`;
const viewportNew = `<div ref={wrapperRef} className="flex-1 overflow-auto bg-[#09090b] relative w-full h-full flex items-center justify-center">
                        <div className="m-auto bg-white rounded-sm shadow-2xl ring-1 ring-slate-800/30 overflow-hidden relative transition-transform origin-center" style={{ width: canvasWidth, height: canvasHeight, transform: \`scale(\${zoomRatio})\` }}>`;
c = c.replace(viewportOld, viewportNew);



fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', c);
console.log('Done script configuration part 2');
