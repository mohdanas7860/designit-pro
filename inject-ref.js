const fs = require('fs');
let c = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

const func = `
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

c = c.replace('    return (', func + '\\n    return (');
fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', c);
