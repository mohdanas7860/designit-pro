const fs = require('fs');
let code = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

// 1. History processing logic update
code = code.replace(/historyProcessing\.current/g, 'isPerformingHistoryAction.current');
code = code.replace(/const historyProcessing = useRef<boolean>\(false\);/g, 'const isPerformingHistoryAction = useRef<boolean>(false);');

code = code.replace(/historyList\.current\[historyIndex\.current\], \(\) => \{([\s\S]*?)\}\);/g, 'historyList.current[historyIndex.current]).then(() => {$1});');

// 2. Add Fabric classes to import
code = code.replace(/import \{ Canvas, Rect, Circle, IText, FabricImage, FabricObject, Shadow \} from 'fabric';/g, "import { Canvas, Rect, Circle, IText, FabricImage, FabricObject, Shadow, Triangle, Line, filters } from 'fabric';");

// 3. Add lucide icons
code = code.replace(/    ImagePlus\n\} from "lucide-react";/g, `    ImagePlus,
    Triangle as TriangleIcon,
    Minus,
    ZoomIn,
    ZoomOut,
    Maximize,
    AlignTop,
    AlignBottom
} from "lucide-react";`);

// 4. Implement Shapes
const newShapes = `
    const addTriangle = () => {
        if (!canvas) return;
        const tri = new Triangle({
            left: 400, top: 300, fill: "#10b981", width: 100, height: 100,
            originX: "center", originY: "center", name: "Triangle"
        });
        canvas.add(tri); canvas.setActiveObject(tri); saveHistory(canvas);
    };

    const addLine = () => {
        if (!canvas) return;
        const line = new Line([50, 50, 200, 50], {
            left: 400, top: 300, stroke: "#6366f1", strokeWidth: 4,
            originX: "center", originY: "center", name: "Line"
        });
        canvas.add(line); canvas.setActiveObject(line); saveHistory(canvas);
    };
`;
code = code.replace(/    const deleteSelected = \(\) => \{/g, newShapes + "\n    const deleteSelected = () => {");

const shapeButtons = `
                        <button onClick={addTriangle} title="Add Triangle" className="p-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] active:bg-[#252525] rounded-md transition-colors border border-[#3d3d3d]">
                            <TriangleIcon size={16} className="text-emerald-500 fill-emerald-500" />
                        </button>
                        <button onClick={addLine} title="Add Line" className="p-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] active:bg-[#252525] rounded-md transition-colors border border-[#3d3d3d]">
                            <Minus size={16} className="text-indigo-500 stroke-[4px]" />
                        </button>
`;
code = code.replace(/                        <button\n                            onClick=\{addText\}/g, shapeButtons + "\n                        <button\n                            onClick={addText}");

// 5. Presets Dropdown
const presetsState = `
    const [preset, setPreset] = useState("Custom");
    const handlePresetChange = (e: any) => {
        if (!canvas) return;
        const val = e.target.value;
        setPreset(val);
        let w = 800, h = 600;
        if (val === "IG") { w = 800; h = 800; }
        else if (val === "YT") { w = 1280; h = 720; }
        else if (val === "Story") { w = 600; h = 1000; }
        
        canvas.setWidth(w);
        canvas.setHeight(h);
        canvas.renderAll();
    };
`;
code = code.replace(/    \/\/ Utility to refresh React state/g, presetsState + "\n    // Utility to refresh React state");

const presetsUI = `
                    <div className="flex items-center space-x-2 border-l border-[#2d2d2d] pl-6 ml-6">
                        <span className="text-xs text-gray-400">Size:</span>
                        <select value={preset} onChange={handlePresetChange} className="bg-[#2d2d2d] border border-[#3d3d3d] rounded text-sm px-2 py-1 focus:outline-none focus:border-blue-500 text-gray-200">
                            <option value="Custom">Custom</option>
                            <option value="IG">Instagram Post</option>
                            <option value="YT">YouTube Thumbnail</option>
                            <option value="Story">Story / Mobile</option>
                        </select>
                    </div>
`;
code = code.replace(/                    \{\/\* File \/ Creation Tools \*\/\}/g, presetsUI + "\n                    {/* File / Creation Tools */}");

// 6. Zoom Controls UI
const zoomUI = `
                    <div className="absolute bottom-6 left-6 flex items-center space-x-2 bg-[#141414] border border-[#2d2d2d] rounded-md p-1 shadow-md">
                        <button onClick={() => { if(canvas) canvas.setZoom(canvas.getZoom() * 0.9) }} className="p-1 hover:bg-[#2a2a2a] rounded text-gray-400"><ZoomOut size={16} /></button>
                        <span className="text-xs font-medium px-2">{canvas ? Math.round(canvas.getZoom()*100) : 100}%</span>
                        <button onClick={() => { if(canvas) canvas.setZoom(canvas.getZoom() * 1.1) }} className="p-1 hover:bg-[#2a2a2a] rounded text-gray-400"><ZoomIn size={16} /></button>
                        <button onClick={() => { if(canvas) canvas.setZoom(1) }} className="p-1 hover:bg-[#2a2a2a] rounded text-gray-400"><Maximize size={16} /></button>
                    </div>
`;
code = code.replace(/                    <div className="absolute bottom-6 right-6/g, zoomUI + '\n                    <div className="absolute bottom-6 right-6');

// 7. Align Controls
const alignFunctions = `
    const alignObject = (type: string) => {
        if (!canvas || !activeObject) return;
        const cvsWidth = canvas.width || 800;
        const cvsHeight = canvas.height || 600;
        const objWidth = activeObject.getScaledWidth();
        const objHeight = activeObject.getScaledHeight();

        switch (type) {
            case "left":
                activeObject.set("left", objWidth / 2);
                break;
            case "center-h":
                activeObject.set("left", cvsWidth / 2);
                break;
            case "right":
                activeObject.set("left", cvsWidth - (objWidth / 2));
                break;
            case "top":
                activeObject.set("top", objHeight / 2);
                break;
            case "center-v":
                activeObject.set("top", cvsHeight / 2);
                break;
            case "bottom":
                activeObject.set("top", cvsHeight - (objHeight / 2));
                break;
        }
        activeObject.setCoords();
        canvas.renderAll();
        saveHistory(canvas);
        updateState(canvas);
    };
`;
code = code.replace(/    const isLocked = /g, alignFunctions + "\n    const isLocked = ");

const alignUI = `
                            {/* Alignment Controls */}
                            <div className="space-y-2 pt-2 border-t border-[#2d2d2d]">
                                <label className="text-gray-400 block pb-1">Align to Canvas</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => alignObject('left')} className="p-1.5 flex justify-center bg-[#252525] border border-[#3d3d3d] hover:bg-[#333] rounded"><AlignLeft size={14}/></button>
                                    <button onClick={() => alignObject('center-h')} className="p-1.5 flex justify-center bg-[#252525] border border-[#3d3d3d] hover:bg-[#333] rounded"><AlignCenter size={14}/></button>
                                    <button onClick={() => alignObject('right')} className="p-1.5 flex justify-center bg-[#252525] border border-[#3d3d3d] hover:bg-[#333] rounded"><AlignRight size={14}/></button>
                                    <button onClick={() => alignObject('top')} className="p-1.5 flex justify-center bg-[#252525] border border-[#3d3d3d] hover:bg-[#333] rounded"><AlignTop size={14}/></button>
                                    <button onClick={() => alignObject('center-v')} className="p-1.5 flex justify-center bg-[#252525] border border-[#3d3d3d] hover:bg-[#333] rounded"><Minus size={14}/></button>
                                    <button onClick={() => alignObject('bottom')} className="p-1.5 flex justify-center bg-[#252525] border border-[#3d3d3d] hover:bg-[#333] rounded"><AlignBottom size={14}/></button>
                                </div>
                            </div>
`;
code = code.replace(/                            \{\/\* Opacity \*\/\}/g, alignUI + "\n                            {/* Opacity */}");

// 8. Filters Logic
const filtersApplyFn = `
    const handleFilterChange = (filterClass: any, type: string, prop: string, value: number | boolean) => {
        if (!canvas || !activeObject || activeObject.type !== "image") return;
        
        let existingFilters = (activeObject as any).filters || [];
        
        if (typeof value === "boolean") {
            if (value) existingFilters.push(new filterClass());
            else existingFilters = existingFilters.filter((f: any) => f.type !== type);
        } else {
            let filterTarget = existingFilters.find((f: any) => f.type === type);
            if (!filterTarget) {
                filterTarget = new filterClass();
                existingFilters.push(filterTarget);
            }
            filterTarget[prop] = value;
        }

        (activeObject as any).filters = existingFilters;
        (activeObject as any).applyFilters();
        canvas.renderAll();
        updateState(canvas);
        saveHistory(canvas);
    };

    const hasFilter = (type: string) => {
        if (!activeObject || activeObject.type !== "image") return false;
        return ((activeObject as any).filters || []).some((f: any) => f.type === type);
    };

    const getFilterValue = (type: string, prop: string, def: number) => {
        if (!activeObject || activeObject.type !== "image") return def;
        const f = ((activeObject as any).filters || []).find((f: any) => f.type === type);
        return f ? f[prop] : def;
    };
`;
code = code.replace(/    \/\/ Helper to read property values safely/g, filtersApplyFn + "\n    // Helper to read property values safely");

const filtersUI = `
                            {/* Image Filters */}
                            {activeObject.type === "image" && (
                                <div className="space-y-4 pt-2 border-t border-[#2d2d2d]">
                                    <label className="text-gray-400 block pb-1">Image Filters</label>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs"><label>Brightness</label><span>{getFilterValue('Brightness', 'brightness', 0).toFixed(2)}</span></div>
                                        <input type="range" min="-1" max="1" step="0.05" value={getFilterValue('Brightness', 'brightness', 0)} onChange={(e) => handleFilterChange(filters.Brightness, 'Brightness', 'brightness', parseFloat(e.target.value))} className="w-full accent-blue-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs"><label>Contrast</label><span>{getFilterValue('Contrast', 'contrast', 0).toFixed(2)}</span></div>
                                        <input type="range" min="-1" max="1" step="0.05" value={getFilterValue('Contrast', 'contrast', 0)} onChange={(e) => handleFilterChange(filters.Contrast, 'Contrast', 'contrast', parseFloat(e.target.value))} className="w-full accent-blue-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs"><label>Saturation</label><span>{getFilterValue('Saturation', 'saturation', 0).toFixed(2)}</span></div>
                                        <input type="range" min="-1" max="1" step="0.05" value={getFilterValue('Saturation', 'saturation', 0)} onChange={(e) => handleFilterChange(filters.Saturation, 'Saturation', 'saturation', parseFloat(e.target.value))} className="w-full accent-blue-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs"><label>Blur</label><span>{getFilterValue('Blur', 'blur', 0).toFixed(2)}</span></div>
                                        <input type="range" min="0" max="1" step="0.05" value={getFilterValue('Blur', 'blur', 0)} onChange={(e) => handleFilterChange(filters.Blur, 'Blur', 'blur', parseFloat(e.target.value))} className="w-full accent-blue-500" />
                                    </div>
                                    <div className="flex space-x-2 pt-2">
                                        <label className="flex items-center space-x-2 text-xs">
                                            <input type="checkbox" checked={hasFilter('Grayscale')} onChange={(e) => handleFilterChange(filters.Grayscale, 'Grayscale', '', e.target.checked)} className="accent-blue-500 rounded" />
                                            <span>Grayscale</span>
                                        </label>
                                        <label className="flex items-center space-x-2 text-xs">
                                            <input type="checkbox" checked={hasFilter('Sepia')} onChange={(e) => handleFilterChange(filters.Sepia, 'Sepia', '', e.target.checked)} className="accent-blue-500 rounded" />
                                            <span>Sepia</span>
                                        </label>
                                    </div>
                                </div>
                            )}
`;
code = code.replace(/                            \{\/\* Rectangle Specific: Corner Radius \*\/\}/g, filtersUI + "\n                            {/* Rectangle Specific: Corner Radius */}");

fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', code);
console.log('Update script fully written and applied!');
