const fs = require('fs');

let content = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

// 1. Imports
content = content.replace('import * as fabric from "fabric";', "import { Canvas, Rect, Circle, IText, FabricImage, FabricObject, Shadow } from 'fabric';");

// 2. Fabric Instantiations & Types
content = content.replace(/fabric\.Canvas/g, 'Canvas');
content = content.replace(/fabric\.Object/g, 'FabricObject');
content = content.replace(/fabric\.Rect/g, 'Rect');
content = content.replace(/fabric\.Circle/g, 'Circle');
content = content.replace(/fabric\.IText/g, 'IText');
content = content.replace(/fabric\.Shadow/g, 'Shadow');
content = content.replace(/fabric\.Image/g, 'FabricImage');
content = content.replace(/fabric\.IEvent/g, 'any');

// 3. Fix implicit anys
// line 182 approx: initCanvas.on("object:added", (e) => {
content = content.replace(/initCanvas\.on\("object:added", \(e\) => \{/, 'initCanvas.on("object:added", (e: any) => {');

// line 230 approx: activeObjects.forEach((obj) => canvas.remove(obj));
// line 312 approx
content = content.replace(/activeObjects\.forEach\(\(obj\) => canvas\.remove\(obj\)\);/g, 'activeObjects.forEach((obj: any) => canvas.remove(obj));');

// line 332 approx: reader.onload = (f) => {
content = content.replace(/reader\.onload = \(f\) => \{/, 'reader.onload = (f: any) => {');

// line 333 approx: FabricImage.fromURL(data, (img) => {
content = content.replace(/FabricImage\.fromURL\(data, \(img\) => \{/, 'FabricImage.fromURL(data, (img: any) => {');

// 4. Missing exportAsSVG functionality
let exportSVGCode = `
    const exportAsSVG = () => {
        if (!canvas) return;
        canvas.discardActiveObject();
        canvas.renderAll();
        
        const svg = canvas.toSVG();
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const link = document.createElement("a");
        link.download = "canvas-export.svg";
        link.href = URL.createObjectURL(blob);
        link.click();

        setExportOpen(false);
    };

    const exportAsJSON`;

content = content.replace('    const exportAsJSON', exportSVGCode);

// Add SVG export button
let exportSVGButton = `
                                <button
                                    onClick={exportAsSVG}
                                    className="w-full text-left px-4 py-2 hover:bg-[#2a2a2a] flex items-center space-x-2 text-sm text-gray-200"
                                >
                                    <ImageIcon size={14} />
                                    <span>Download as SVG</span>
                                </button>
                                <button
                                    onClick={exportAsJSON}`;

content = content.replace(/                                <button\n                                    onClick={exportAsJSON}/g, exportSVGButton);


fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', content);

console.log('Modifications written to src/components/Editor/CanvasEditor.tsx');
