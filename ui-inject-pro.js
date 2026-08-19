const fs = require('fs');
let c = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

// 1. Add "Photos" Tab in dock
const dockUpload = `<button onClick={() => setActiveTab('uploads')} className={\`p-3 rounded-xl transition-all \${activeTab === 'uploads' ? 'bg-pink-600/20 text-pink-500' : 'text-zinc-500 hover:text-gray-300 hover:bg-zinc-800'}\`}>
                    <UploadCloud size={20} strokeWidth={1.5} />
                </button>`;
const dockPhotos = `                <button onClick={() => setActiveTab('photos')} className={\`p-3 rounded-xl transition-all \${activeTab === 'photos' ? 'bg-purple-600/20 text-purple-500' : 'text-zinc-500 hover:text-gray-300 hover:bg-zinc-800'}\`}>
                    <Camera size={20} strokeWidth={1.5} />
                </button>`;
c = c.replace(dockUpload, dockUpload + '\\n' + dockPhotos);

// 2. Add 'Photos' drawer content
const uploadsDrawer = `{activeTab === 'uploads' && (`;
const photosDrawer = `{activeTab === 'photos' && (
                        <div className="space-y-4">
                            <label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">Stock Photos</label>
                            <div className="grid grid-cols-2 gap-2">
                                {photosLoaded.map((url, i) => (
                                    <img key={i} src={url} alt="Stock" onClick={() => addPhoto(url)} className="w-full h-24 object-cover rounded-md cursor-pointer border border-zinc-800 hover:border-purple-500 transition-colors" />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'uploads' && (`
c = c.replace(uploadsDrawer, photosDrawer);

// 3. Add to Elements Tab
const addElementsBtn = `<button onClick={addLine} className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 flex justify-center"><Minus size={20} className="text-amber-500 stroke-[4px]" /></button>`;
const addFramesBtn = `${addElementsBtn}
                            <button onClick={addCircleFrame} className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 flex justify-center"><Frame size={20} className="text-pink-500" /></button>
                            <button onClick={addStarFrame} className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 flex justify-center"><Star size={20} className="text-yellow-500 fill-yellow-500/20" /></button>`;
c = c.replace(addElementsBtn, addFramesBtn);

// 4. Update Exports
const oldExport = `<button onClick={exportAsPNG} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center space-x-3 text-sm text-gray-300 transition-colors"><ImageIcon size={14} className="text-blue-400" /><span>PNG Image</span></button>
                                    <button onClick={exportAsSVG} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center space-x-3 text-sm text-gray-300 transition-colors"><FileImage size={14} className="text-pink-400"/><span>SVG Vector</span></button>
                                    <button onClick={exportAsJSON} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center space-x-3 text-sm text-gray-300 transition-colors"><FileJson size={14} className="text-emerald-400"/><span>JSON State</span></button>`;
const newExport = `<button onClick={exportHDPNG} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center space-x-3 text-sm text-gray-300 transition-colors"><DownloadCloud size={14} className="text-orange-400"/><span>Ultra HD 4K PNG</span></button>
                                    <button onClick={exportTransparentPNG} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center space-x-3 text-sm text-gray-300 transition-colors"><ImageIcon size={14} className="text-blue-400" /><span>Transparent PNG</span></button>
                                    <button onClick={exportAsPNG} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center space-x-3 text-sm text-gray-300 transition-colors"><ImageIcon size={14} className="text-gray-400" /><span>Standard PNG</span></button>
                                    <button onClick={exportPrintPDF} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center space-x-3 text-sm text-gray-300 transition-colors"><FileText size={14} className="text-red-400"/><span>Print PDF</span></button>
                                    <button onClick={exportAsJSON} className="w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center space-x-3 text-sm text-gray-300 transition-colors"><FileJson size={14} className="text-emerald-400"/><span>JSON State</span></button>`;
c = c.replace(oldExport, newExport);

// 5. Image Tools (Remove BG & Frame Upload)
const imgFilters = `{activeObject.type === "image" && (`;
const aiAndFrames = `
                        {activeObject.type === "image" && (
                            <div className="space-y-4 pt-6 border-t border-zinc-800/50">
                                <label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2"><Wand2 size={14}/><span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Magic Tools</span></label>
                                <button onClick={removeBg} disabled={isProcessingBgRemoval} className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center justify-center space-x-2">
                                    {isProcessingBgRemoval ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <><Sparkles size={14} /><span>Remove Background</span></>}
                                </button>
                            </div>
                        )}

                        {(activeObject as any).isFrame && (
                            <div className="space-y-4 pt-6 border-t border-zinc-800/50">
                                <input type="file" accept="image/*" onChange={fillFrameWithImage} ref={fillFrameRef} className="hidden" />
                                <button onClick={() => fillFrameRef.current?.click()} className="w-full py-3 border-2 border-dashed border-pink-500/50 hover:border-pink-500 text-pink-400 rounded-xl text-xs font-semibold transition-colors flex justify-center items-center space-x-2 shadow-sm">
                                    <ImagePlus size={16} /> <span>Fill Frame with Image</span>
                                </button>
                            </div>
                        )}
                        
                        {activeObject.type === "image" && (`;
c = c.replace(imgFilters, aiAndFrames);

// 6. Typography FX
const textStyles = `<div className="flex space-x-2">
                                    <button onClick={() => setProp("fontWeight", getProp("fontWeight", "normal") === "bold" ? "normal" : "bold")} className={\`p-2 flex-1 rounded border \${getProp("fontWeight", "normal") === "bold" ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"}\`}><Bold size={14} className="mx-auto" /></button>
                                    <button onClick={() => setProp("fontStyle", getProp("fontStyle", "normal") === "italic" ? "normal" : "italic")} className={\`p-2 flex-1 rounded border \${getProp("fontStyle", "normal") === "italic" ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"}\`}><Italic size={14} className="mx-auto" /></button>
                                </div>`;

const textFX = `${textStyles}
                                <div className="space-y-3 pt-4 border-t border-zinc-800/30">
                                    <label className="text-zinc-500 text-[10px] font-semibold uppercase flex items-center justify-between"><span className="flex-1">Curvature</span><span className="font-mono">{curveVal}°</span></label>
                                    <input type="range" min="-180" max="180" step="5" value={curveVal} onChange={(e) => updateCurve(parseInt(e.target.value))} className="w-full accent-emerald-500" />
                                </div>
                                <div className="space-y-2 pt-4">
                                    <label className="text-zinc-500 text-[10px] font-semibold uppercase">Pro Text FX</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={applyNeon} className="py-2 text-[10px] font-bold text-pink-400 bg-pink-900/20 border border-pink-500/30 rounded-md hover:bg-pink-900/40">NEON</button>
                                        <button onClick={applyHollow} className="py-2 text-[10px] font-bold text-blue-400 bg-blue-900/20 border border-blue-500/30 rounded-md hover:bg-blue-900/40">HOLLOW</button>
                                        <button onClick={applyDropShadowText} className="py-2 text-[10px] font-bold text-zinc-300 bg-zinc-800 border border-zinc-700/50 rounded-md hover:bg-zinc-700">SHADOW</button>
                                    </div>
                                </div>`;
c = c.replace(textStyles, textFX);

fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', c);
console.log("UI Injected Complete");
