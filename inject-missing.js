const fs = require('fs');

const missingLogic = `
        return () => {
            initCanvas.dispose();
        };
    }, []);

    const addRectangle = () => {
        if (!canvas) return;
        const rect = new Rect({ left: 100, top: 100, fill: "#3b82f6", width: 100, height: 100, originX: 'center', originY: 'center', shadow: new Shadow({ color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 5, offsetY: 5 }) });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        saveHistory(canvas);
        updateState(canvas);
    };

    const addCircle = () => {
        if (!canvas) return;
        const circle = new Circle({ left: 200, top: 200, fill: "#ec4899", radius: 50, originX: 'center', originY: 'center', shadow: new Shadow({ color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 5, offsetY: 5 }) });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        saveHistory(canvas);
        updateState(canvas);
    };

    const addText = () => {
        if (!canvas) return;
        const text = new IText("New Text", { left: 150, top: 150, fontFamily: "Inter, sans-serif", fontSize: 40, fill: "#ffffff", fontWeight: 'bold' });
        canvas.add(text);
        canvas.setActiveObject(text);
        saveHistory(canvas);
        updateState(canvas);
    };

    const deleteSelected = () => {
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) {
            canvas.discardActiveObject();
            activeObjects.forEach((obj) => canvas.remove(obj));
            saveHistory(canvas);
            updateState(canvas);
        }
    };

    const handleImageUpload = (e: any) => {
        const file = e.target.files?.[0];
        if (!file || !canvas) return;
        const reader = new FileReader();
        reader.onload = function (f) {
            const data = f.target?.result as string;
            FabricImage.fromURL(data).then((img: FabricImage) => {
                img.scaleToWidth(300);
                img.set({ left: 100, top: 100 });
                canvas.add(img);
                canvas.setActiveObject(img);
                saveHistory(canvas);
                updateState(canvas);
            });
        };
        reader.readAsDataURL(file);
    };

    const exportAsPNG = () => {
        if (!canvas) return;
        const dataURL = canvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
        const link = document.createElement("a");
        link.download = "designit-export.png";
        link.href = dataURL;
        link.click();
    };

    const exportAsJSON = () => {
        if (!canvas) return;
        const json = JSON.stringify((canvas as any).toJSON(["name", "visible", "lockMovementX", "lockMovementY", "lockRotation", "lockScalingX", "lockScalingY", "selectable", "hasControls"]));
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "designit-project.json";
        link.href = url;
        link.click();
    };

    const exportAsSVG = () => {
        if (!canvas) return;
        const svg = canvas.toSVG();
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "designit-export.svg";
        link.href = url;
        link.click();
    };

    const toggleLock = (obj: FabricObject) => {
        if (!canvas) return;
        const locked = !obj.evented;
        obj.set({
            evented: locked,
            selectable: locked,
            lockMovementX: !locked,
            lockMovementY: !locked,
            lockRotation: !locked,
            lockScalingX: !locked,
            lockScalingY: !locked,
            hasControls: locked,
        });
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        saveHistory(canvas);
        updateState(canvas);
    };

    const toggleVisibility = (obj: FabricObject) => {
        if (!canvas) return;
        obj.visible = obj.visible === false ? true : false;
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        saveHistory(canvas);
        updateState(canvas);
    };

    const setProp = (prop: string, val: any) => {
        if (!canvas || !activeObject) return;
        if (activeObject.type === "activeSelection") {
            const objs = (activeObject as any).getObjects();
            objs.forEach((o: any) => o.set(prop, val));
        } else {
            activeObject.set(prop, val);
        }
        canvas.requestRenderAll();
        saveHistory(canvas);
        updateState(canvas);
    };

    const getProp = (prop: string, defaultVal: any) => {
        if (!activeObject) return defaultVal;
        return activeObject.get(prop) || defaultVal;
    };

    const alignObject = (position: string) => {
        if (!canvas || !activeObject) return;
        const cw = canvas.width || 800;
        const ch = canvas.height || 600;
        const objW = activeObject.getScaledWidth();
        const objH = activeObject.getScaledHeight();

        let l = activeObject.left || 0;
        let t = activeObject.top || 0;

        const bound = activeObject.getBoundingRect();

        if (position === 'center-h') l = (cw / 2) - (bound.width / 2) + (l - bound.left);
        if (position === 'center-v') t = (ch / 2) - (bound.height / 2) + (t - bound.top);
        if (position === 'left') l = 0 + (l - bound.left);
        if (position === 'right') l = cw - bound.width + (l - bound.left);
        if (position === 'top') t = 0 + (t - bound.top);
        if (position === 'bottom') t = ch - bound.height + (t - bound.top);

        activeObject.set({ left: l, top: t });
        activeObject.setCoords();
        canvas.requestRenderAll();
        saveHistory(canvas);
        updateState(canvas);
    };

    const handleFilterChange = (FilterClass: any, filterName: string, propName: string, value: any) => {
        if (!canvas || !activeObject || activeObject.type !== "image") return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const img = activeObject as any;
        const existingFilters = img.filters || [];
        
        // Remove existing of same class
        for (let i = existingFilters.length - 1; i >= 0; i--) {
            if (existingFilters[i] instanceof FilterClass) {
                existingFilters.splice(i, 1);
            }
        }

        if (typeof value === "boolean" && value) {
            existingFilters.push(new FilterClass());
        } else if (typeof value === "number" && propName) {
            const f = new FilterClass();
            f[propName] = value;
            existingFilters.push(f);
        }

        img.filters = existingFilters;
        img.applyFilters();
        canvas.requestRenderAll();
        saveHistory(canvas);
        updateState(canvas);
    };

    const getFilterValue = (className: string, propName: string, defaultVal: number) => {
        if (!activeObject || activeObject.type !== "image") return defaultVal;
        const img = activeObject as any;
        if (!img.filters) return defaultVal;
        const f = img.filters.find((filter: any) => filter.constructor.name === className);
        return f ? f[propName] : defaultVal;
    };

    const hasFilter = (className: string) => {
        if (!activeObject || activeObject.type !== "image") return false;
        const img = activeObject as any;
        if (!img.filters) return false;
        return img.filters.some((filter: any) => filter.constructor.name === className);
    };

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

    const addTriangle = () => {
        if (!canvas) return;
        const triangle = new Triangle({ left: 300, top: 300, fill: "#10b981", width: 100, height: 100, originX: 'center', originY: 'center' });
        canvas.add(triangle);
        canvas.setActiveObject(triangle);
        saveHistory(canvas);
        updateState(canvas);
    };

    const addLine = () => {
        if (!canvas) return;
        const line = new Line([50, 50, 200, 50], { left: 300, top: 300, stroke: "#f59e0b", strokeWidth: 5, originX: 'center', originY: 'center' });
        canvas.add(line);
        canvas.setActiveObject(line);
        saveHistory(canvas);
        updateState(canvas);
    };

    const [activeTab, setActiveTab] = useState("templates");
    const [gradColor1, setGradColor1] = useState("#ec4899");
    const [gradColor2, setGradColor2] = useState("#8b5cf6");
    const [gradAngle, setGradAngle] = useState(45);
`;

let code = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

// Replace selection:cleared up to the return ( with the missing logic
code = code.replace(/        initCanvas\.on\("selection:cleared", handleCanvasEvents\);\s+return \(/,
    '        initCanvas.on("selection:cleared", handleCanvasEvents);\n' + missingLogic + '\n    return (');

fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', code);
console.log('Restored logic');
