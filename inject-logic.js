const fs = require('fs');
let code = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');


// 1. MAGNETIC SNAPPING LOGIC (Inject into useEffect where other object events are hooked)
const snapLogic = `
        let snapLines: FabricObject[] = [];

        const clearSnapLines = () => {
            if (!initCanvas) return;
            snapLines.forEach((line) => initCanvas.remove(line));
            snapLines = [];
            initCanvas.renderAll();
        };

        initCanvas.on("object:moving", (e: any) => {
            const obj = e.target;
            if (!obj) return;

            clearSnapLines(); // clear previous
            
            const snapThreshold = 5;
            const canvasW = initCanvas.width || 800;
            const canvasH = initCanvas.height || 600;
            const centerX = canvasW / 2;
            const centerY = canvasH / 2;

            const objW = obj.getScaledWidth();
            const objH = obj.getScaledHeight();
            const objCenterX = obj.left + (obj.originX === 'center' ? 0 : objW / 2);
            const objCenterY = obj.top + (obj.originY === 'center' ? 0 : objH / 2);

            let snapped = false;

            // Snap to Canvas Vertical Center (Y axis)
            if (Math.abs(objCenterY - centerY) < snapThreshold) {
                obj.set("top", obj.originY === 'center' ? centerY : centerY - objH / 2);
                snapped = true;
                const hLine = new Line([0, centerY, canvasW, centerY], { stroke: '#06b6d4', strokeWidth: 1, selectable: false, evented: false });
                snapLines.push(hLine);
                initCanvas.add(hLine);
            }

            // Snap to Canvas Horizontal Center (X axis)
            if (Math.abs(objCenterX - centerX) < snapThreshold) {
                obj.set("left", obj.originX === 'center' ? centerX : centerX - objW / 2);
                snapped = true;
                const vLine = new Line([centerX, 0, centerX, canvasH], { stroke: '#06b6d4', strokeWidth: 1, selectable: false, evented: false });
                snapLines.push(vLine);
                initCanvas.add(vLine);
            }

            // (Further logic for sibling snapping could be added here iterating initCanvas.getObjects())
            
            if (snapped) {
                initCanvas.renderAll();
            }
        });

        initCanvas.on("mouse:up", clearSnapLines);
`;

code = code.replace(/        initCanvas\.on\("object:added", \(e: any\) => \{/g, snapLogic + '\n        initCanvas.on("object:added", (e: any) => {');


// 2. TEMPLATES LOGIC
const templatesLogic = `
    const loadTemplate = (type: string) => {
        if (!canvas) return;
        canvas.clear();
        canvas.backgroundColor = "#09090b";
        
        if (type === 'SaleBanner') {
            const rect = new Rect({ left: 400, top: 300, width: 600, height: 400, originX: 'center', originY: 'center', fill: new fabric.Gradient({ type: 'linear', coords: {x1: 0, y1: 0, x2: 600, y2: 400}, colorStops: [{offset: 0, color: '#ec4899'}, {offset: 1, color: '#8b5cf6'}]}) });
            const text = new IText("MEGA SALE", { left: 400, top: 250, fill: "#ffffff", fontSize: 64, fontWeight: 'bold', originX: 'center', originY: 'center', shadow: new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 10 }) });
            const btn = new Rect({ left: 400, top: 350, width: 200, height: 50, rx: 25, ry: 25, originX: 'center', originY: 'center', fill: '#ffffff' });
            const btnText = new IText("SHOP NOW", { left: 400, top: 350, fill: "#ec4899", fontSize: 20, fontWeight: 'bold', originX: 'center', originY: 'center' });
            canvas.add(rect, text, btn, btnText);
        } else if (type === 'QuoteCard') {
            const card = new Rect({ left: 400, top: 300, width: 500, height: 500, originX: 'center', originY: 'center', fill: '#18181b', rx: 20, ry: 20 });
            const quote = new IText('"Design is intelligence \\nmade visible."', { left: 400, top: 250, fill: "#f4f4f5", fontSize: 32, fontStyle: 'italic', textAlign: 'center', originX: 'center', originY: 'center' });
            const author = new IText("- Alina Wheeler", { left: 400, top: 350, fill: "#a1a1aa", fontSize: 20, originX: 'center', originY: 'center' });
            canvas.add(card, quote, author);
        } else if (type === 'SocialPromo') {
            const circle = new Circle({ radius: 200, fill: '#3b82f6', left: 400, top: 300, originX: 'center', originY: 'center' });
            const text1 = new IText("NEW ARRIVALS", { left: 400, top: 250, fill: "#ffffff", fontSize: 40, fontWeight: 'bold', originX: 'center', originY: 'center' });
            const text2 = new IText("Summer Collection 2026", { left: 400, top: 300, fill: "#bfdbfe", fontSize: 24, originX: 'center', originY: 'center' });
            canvas.add(circle, text1, text2);
        }
        
        canvas.renderAll();
        setTimeout(() => saveHistory(canvas), 100);
        updateState(canvas);
    };
`;

code = code.replace(/    const addTriangle = \(\) => \{/g, templatesLogic + '\n    const addTriangle = () => {');

// 3. GRADIENTS LOGIC
const gradientsLogic = `
    const [gradColor1, setGradColor1] = useState("#ec4899");
    const [gradColor2, setGradColor2] = useState("#8b5cf6");
    const [gradAngle, setGradAngle] = useState(45);

    const applyGradient = () => {
        if (!canvas || !activeObject) return;
        const angleRad = (gradAngle * Math.PI) / 180;
        const w = activeObject.width || 100;
        const h = activeObject.height || 100;
        
        // Approximate calculation for linear gradient coords bounding box
        const x1 = (1 - Math.cos(angleRad)) * w / 2;
        const y1 = (1 - Math.sin(angleRad)) * h / 2;
        const x2 = (1 + Math.cos(angleRad)) * w / 2;
        const y2 = (1 + Math.sin(angleRad)) * h / 2;

        const gradient = new fabric.Gradient({
            type: 'linear',
            coords: { x1, y1, x2, y2 },
            colorStops: [
                { offset: 0, color: gradColor1 },
                { offset: 1, color: gradColor2 }
            ]
        });

        activeObject.set("fill", gradient);
        canvas.renderAll();
        saveHistory(canvas);
        updateState(canvas);
    };
    
    // Add activeTab state for left dock
    const [activeTab, setActiveTab] = useState("templates");
`;
code = code.replace(/    const isLocked = activeObject \? \!activeObject\.evented \: false;/g, gradientsLogic + "\n    const isLocked = activeObject ? !activeObject.evented : false;");


// Fix fabric.Gradient import reference
code = code.replace(/import \{ Canvas, Rect, Circle, IText, FabricImage/g, 'import * as fabric from "fabric";\n// NOTE: Reverting to * as fabric reference inside some components for explicit gradients, but keep named imports for the ones used\nimport { Canvas, Rect, Circle, IText, FabricImage');

fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', code);
console.log("Logic injected.");
