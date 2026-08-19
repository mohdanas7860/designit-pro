const fs = require('fs');

let c = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

// 1. Inject canvas creation variables
c = c.replace('width: 800,', 'width: canvasWidth,');
c = c.replace('height: 600,', 'height: canvasHeight,');
c = c.replace('backgroundColor: "#09090b",', 'backgroundColor: documentBgColor,');

// 2. Inject structural methods
const funcs = `
    const changeSize = (w: number, h: number) => {
        setCanvasWidth(w);
        setCanvasHeight(h);
        if (canvas) {
            canvas.setDimensions({ width: w, height: h });
            canvas.requestRenderAll();
        }
        setCurrentView('editor');
    };

    const switchPage = async (index: number) => {
        if (!canvas) return;
        const updatedPages = [...pages];
        updatedPages[currentPageIndex] = {
            ...updatedPages[currentPageIndex],
            json: JSON.stringify(canvas.toJSON())
        };
        
        canvas.clear();
        canvas.backgroundColor = updatedPages[index].bg;
        setDocumentBgColor(updatedPages[index].bg);
        
        if (updatedPages[index].json) {
            await canvas.loadFromJSON(JSON.parse(updatedPages[index].json));
        }
        
        canvas.requestRenderAll();
        setPages(updatedPages);
        setCurrentPageIndex(index);
    };

    const addPage = () => {
        const newIdx = pages.length;
        const blankPage = { id: Date.now().toString(), name: \`Page \${newIdx + 1}\`, json: '', bg: '#ffffff' };
        
        const updatedPages = [...pages, blankPage];
        if (canvas) {
            updatedPages[currentPageIndex] = {
                ...updatedPages[currentPageIndex],
                json: JSON.stringify(canvas.toJSON())
            };
            canvas.clear();
            canvas.backgroundColor = '#ffffff';
            canvas.requestRenderAll();
        }
        
        setPages(updatedPages);
        setCurrentPageIndex(newIdx);
        setDocumentBgColor('#ffffff');
    };

    const deletePage = (index: number) => {
        if (pages.length <= 1) return;
        const newPages = pages.filter((_, i) => i !== index);
        setPages(newPages);
        if (index === currentPageIndex) {
            switchPage(Math.max(0, index - 1));
        } else if (index < currentPageIndex) {
            setCurrentPageIndex(currentPageIndex - 1);
        }
    };
`;

c = c.replace('    const initCanvas = new Canvas(canvasRef.current, {', funcs + '\\n    const initCanvas = new Canvas(canvasRef.current, {');


// 3. Inject new Layer actions
const layerActionsStr = `
                                            <button onClick={(e) => { e.stopPropagation(); layer.bringForward(); canvas.requestRenderAll(); updateState(canvas); }} className="p-1 hover:text-white" title="Bring Forward"><ChevronUpSquare size={12} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); layer.sendBackwards(); canvas.requestRenderAll(); updateState(canvas); }} className="p-1 hover:text-white" title="Send Backward"><ChevronDownSquare size={12} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); toggleVisibility(layer); }} className="p-1 hover:text-white">{layer.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}</button>
`;
c = c.replace(/<button onClick=\{\(e\) => \{ e\.stopPropagation\(\); toggleVisibility[\s\S]*?<\/button>/, layerActionsStr);


// 4. Wrap the return statement with conditional rendering mapping
const dashboardUI = `
    if (currentView === 'dashboard') {
        return (
            <div className="min-h-screen bg-[#09090b] flex font-sans text-gray-200">
                {/* Left Sidebar Dashboard */}
                <div className="w-64 bg-[#121215] border-r border-zinc-800 flex flex-col p-6 space-y-8">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center space-x-2"><PanelTop size={24} className="text-indigo-500" /> <span>DesignIt Pro</span></h1>
                    
                    <nav className="space-y-2 flex-1">
                        <button className="w-full text-left px-4 py-3 rounded-xl bg-purple-600/20 text-purple-400 font-semibold flex items-center space-x-3"><Home size={18} /><span>Home</span></button>
                        <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-gray-200 font-medium transition-colors flex items-center space-x-3"><LayoutTemplate size={18} /><span>Templates</span></button>
                        <button className="w-full text-left px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-gray-200 font-medium transition-colors flex items-center space-x-3"><Folder size={18} /><span>Projects</span></button>
                    </nav>
                </div>
                
                {/* Main Dashboard Hero */}
                <div className="flex-1 bg-[#09090b] overflow-y-auto">
                    <div className="p-10 space-y-12">
                        
                        <div className="w-full rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 p-12 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="relative z-10 text-center space-y-6">
                                <h1 className="text-4xl font-bold text-white tracking-tight">What will you design today?</h1>
                                <div className="max-w-2xl mx-auto relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input type="text" placeholder="Search your content or Canva's" className="w-full bg-white text-gray-900 rounded-full py-4 pl-12 pr-4 shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-400/50 transition-all font-medium" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-200">You might want to try...</h3>
                            <div className="grid grid-cols-5 gap-6">
                                <button onClick={() => changeSize(1080, 1080)} className="group flex flex-col items-center space-y-3 p-6 rounded-2xl border border-zinc-800 bg-[#121215] hover:bg-zinc-800 transition-colors">
                                    <div className="w-16 h-16 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Camera size={28} /></div>
                                    <span className="text-sm font-semibold">Instagram Post</span>
                                </button>
                                <button onClick={() => changeSize(1280, 720)} className="group flex flex-col items-center space-y-3 p-6 rounded-2xl border border-zinc-800 bg-[#121215] hover:bg-zinc-800 transition-colors">
                                    <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform"><MonitorPlay size={28} /></div>
                                    <span className="text-sm font-semibold">YouTube Thumbnail</span>
                                </button>
                                <button onClick={() => changeSize(1080, 1920)} className="group flex flex-col items-center space-y-3 p-6 rounded-2xl border border-zinc-800 bg-[#121215] hover:bg-zinc-800 transition-colors">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Video size={28} /></div>
                                    <span className="text-sm font-semibold">Insta Story</span>
                                </button>
                                <button onClick={() => changeSize(1240, 1754)} className="group flex flex-col items-center space-y-3 p-6 rounded-2xl border border-zinc-800 bg-[#121215] hover:bg-zinc-800 transition-colors">
                                    <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={28} /></div>
                                    <span className="text-sm font-semibold">A4 Document</span>
                                </button>
                                <button onClick={() => changeSize(1200, 1200)} className="group flex flex-col items-center space-y-3 p-6 rounded-2xl border border-zinc-800 bg-[#121215] hover:bg-zinc-800 transition-colors">
                                    <div className="w-16 h-16 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={28} /></div>
                                    <span className="text-sm font-semibold">Custom Size</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
`;

c = c.replace('    return (\\n        <div className="min-h-screen bg-[#09090b] text-gray-300 flex font-sans overflow-hidden">', dashboardUI + '\\n    return (\\n        <div className="min-h-screen bg-[#09090b] text-gray-300 flex flex-col font-sans overflow-hidden">');

// 5. Update top header inside Canvas Viewport
// Add Background color picker and Dimensions Dropdown
const headerUIOld = `<header className="h-16 flex items-center justify-between px-6 bg-[#121215]/80 backdrop-blur border-b border-zinc-800 z-10">
                    <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">DesignIt</h1>`;

const headerUINew = `<header className="h-16 flex items-center justify-between px-6 bg-[#121215]/80 backdrop-blur border-b border-zinc-800 z-10 shrink-0">
                    <div className="flex items-center space-x-6">
                        <button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Back to Home"><Home size={20} /></button>
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">DesignIt Pro</h1>
                        <div className="h-4 w-[1px] bg-zinc-800"></div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Dimensions:</span>
                            <span className="text-sm font-bold font-mono text-zinc-300">{canvasWidth} &times; {canvasHeight}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Background:</span>
                            <input type="color" value={documentBgColor} onChange={(e) => { 
                                setDocumentBgColor(e.target.value); 
                                if(canvas) { canvas.backgroundColor = e.target.value; canvas.requestRenderAll(); } 
                                const np = [...pages]; np[currentPageIndex].bg = e.target.value; setPages(np);
                            }} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                        </div>
                    </div>`;

c = c.replace(headerUIOld, headerUINew);


// 6. Viewport Styling (White Artboard wrapper)
const canvasWrapOld = `<div className="flex-1 overflow-auto bg-[#09090b] relative w-full h-full p-10 flex cursor-crosshair">
                        <div className="m-auto ring-1 ring-zinc-800 shadow-xl overflow-hidden relative" style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.05) 0, rgba(0,0,0,0) 2px)', backgroundSize: '16px 16px' }}>`;

const canvasWrapNew = `<div className="flex-1 overflow-auto bg-[#09090b] relative w-full h-full p-10 flex">
                        <div className="m-auto ring-1 ring-black/10 shadow-2xl overflow-hidden relative rounded-sm bg-white" style={{ width: canvasWidth, height: canvasHeight }}>`;
c = c.replace(canvasWrapOld, canvasWrapNew);

// 7. Render Multi-Page Bottom Bar
const pageBarUI = `
                 {/* Multi-Page Bottom Bar */}
                 <div className="h-20 bg-[#121215] border-t border-zinc-800 flex items-center px-6 overflow-x-auto shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20 w-full whitespace-nowrap space-x-4">
                        {pages.map((p, i) => (
                            <div key={p.id} onClick={() => switchPage(i)} className={\`relative w-24 h-14 rounded border-2 transition-all cursor-pointer flex items-center justify-center bg-zinc-900 overflow-hidden \${currentPageIndex === i ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-zinc-800 hover:border-zinc-600'}\`}>
                                <span className="text-[10px] font-bold z-10 bg-black/60 px-1 rounded text-white">{p.name}</span>
                                <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundColor: p.bg }}></div>
                                {pages.length > 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); deletePage(i); }} className="absolute -top-1 -right-1 text-red-500 opacity-0 hover:opacity-100 hover:scale-110 transition-all font-bold text-xs p-1">×</button>
                                )}
                            </div>
                        ))}
                        <button onClick={addPage} className="w-14 h-14 rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-500 hover:text-white transition-all bg-zinc-900/50"><Plus size={20} /></button>
                 </div>
`;

// Insert the pageBarUI just before the closing tag of the main editor div wrapper
// The layout is: <div flex content> <LeftDock /> <aside Drawer /> <div canvas section flex-1>...</div></div>
// Oh wait, my old replace made the main div "flex flex-col":
// `return (\n        <div className="min-h-screen bg-[#09090b] text-gray-300 flex flex-col font-sans overflow-hidden">`
// Wait, the original `div` had `<div flex>` implying row flex!
// I need:
// <div min-h-screen flex flex-col>
//    <div flex-1 flex row overflow-hidden>  (This holds Dock, Drawer, Canvas)
//       <Dock/> <Drawer/> <Canvas/>
//    </div>
//    <PageBar />
// </div>

c = c.replace(/    return \(\\n        <div className="min-h-screen bg-\[#09090b\] text-gray-300 flex flex-col font-sans overflow-hidden">/, '    return (\\n        <div className="min-h-screen bg-[#09090b] text-gray-300 flex flex-col font-sans overflow-hidden">\\n            <div className="flex-1 flex overflow-hidden">');

const closingTagsStr = `
                </div>
            </div>
        </div>
    );
`;
const closingTagsNew = `
                </div>
            </div>
${pageBarUI}
        </div>
    );
`;
const lastIdx = c.lastIndexOf('            </div>\\n        </div>\\n    );');
if (lastIdx !== -1) {
    c = c.substring(0, lastIdx) + closingTagsNew;
} else {
    console.log("Could not bind page array closing tags safely. Will attempt substring...");
    c = c.substring(0, c.length - 30) + closingTagsNew;
}

fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', c);
console.log('Done script configuration');
