const fs = require('fs');
let c = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

const funcs = `
    const addCircleFrame = () => {
        if (!canvas) return;
        const circle = new fabric.Circle({ left: 300, top: 300, fill: "#27272a", radius: 100, originX: 'center', originY: 'center', strokeWidth: 4, strokeDashArray: [5,5], stroke: '#3f3f46' });
        (circle as any).isFrame = true;
        canvas.add(circle);
        canvas.setActiveObject(circle);
        saveHistory(canvas);
        updateState(canvas);
    };

    const addStarFrame = () => {
        if (!canvas) return;
        const star = new fabric.Polygon([
            {x: 0, y: -50}, {x: 14, y: -20}, {x: 47, y: -15},
            {x: 23, y: 7}, {x: 29, y: 40}, {x: 0, y: 25},
            {x: -29, y: 40}, {x: -23, y: 7}, {x: -47, y: -15},
            {x: -14, y: -20}
        ], { left: 300, top: 300, fill: "#27272a", originX: 'center', originY: 'center', strokeWidth: 2, strokeDashArray: [5,5], stroke: '#3f3f46', scaleX: 2, scaleY: 2 });
        (star as any).isFrame = true;
        canvas.add(star);
        canvas.setActiveObject(star);
        saveHistory(canvas);
        updateState(canvas);
    };

    const addPhoto = (url: string) => {
        if (!canvas) return;
        fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img: any) => {
            img.scaleToWidth(400);
            img.set({ left: 200, top: 150 });
            canvas.add(img);
            canvas.setActiveObject(img);
            saveHistory(canvas);
            updateState(canvas);
        });
    };

    const removeBg = async () => {
        if (!canvas || !activeObject || activeObject.type !== "image") return;
        try {
            setIsProcessingBgRemoval(true);
            const img = activeObject as any;
            const src = img.getSrc();
            const transparentBlob = await removeBackground(src);
            const url = URL.createObjectURL(transparentBlob);
            fabric.FabricImage.fromURL(url).then((newImg: any) => {
                newImg.set({
                    left: img.left,
                    top: img.top,
                    scaleX: img.scaleX,
                    scaleY: img.scaleY,
                    angle: img.angle
                });
                canvas.remove(img);
                canvas.add(newImg);
                canvas.setActiveObject(newImg);
                canvas.requestRenderAll();
                saveHistory(canvas);
                updateState(canvas);
            });
        } catch (e) {
            console.error(e);
            alert("Failed to remove background.");
        } finally {
            setIsProcessingBgRemoval(false);
        }
    };

    const fillFrameWithImage = (e: any) => {
        const file = e.target.files?.[0];
        if (!file || !canvas || !activeObject || !(activeObject as any).isFrame) return;
        const reader = new FileReader();
        reader.onload = function (f) {
            const data = f.target?.result as string;
            const imgObj = new Image();
            imgObj.onload = () => {
                const pattern = new fabric.Pattern({
                    source: imgObj,
                    repeat: 'no-repeat'
                });
                activeObject.set({ fill: pattern, stroke: 'transparent' });
                canvas.requestRenderAll();
                saveHistory(canvas);
                updateState(canvas);
            };
            imgObj.src = data;
        };
        reader.readAsDataURL(file);
    };
`;

const idx = c.indexOf('    return (\\n        <div');
if (idx !== -1) {
    c = c.substring(0, idx) + funcs + '\\n' + c.substring(idx);
    fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', c);
    console.log('Successfully injected at return statement');
} else {
    console.log('Return statement not found.');
    // Try without \\n
    const idx2 = c.lastIndexOf('    return (');
    if (idx2 !== -1) {
        c = c.substring(0, idx2) + funcs + '\\n' + c.substring(idx2);
        fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', c);
        console.log('Successfully injected using fallback');
    }
}
