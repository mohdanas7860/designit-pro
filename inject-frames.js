const fs = require('fs');
let c = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

const func = `
    const addCircleFrame = () => {
        if (!canvas) return;
        const circle = new Circle({ left: 300, top: 300, fill: "#27272a", radius: 100, originX: 'center', originY: 'center', strokeWidth: 4, strokeDashArray: [5,5], stroke: '#3f3f46' });
        (circle as any).isFrame = true;
        canvas.add(circle);
        canvas.setActiveObject(circle);
        saveHistory(canvas);
        updateState(canvas);
    };

    const addStarFrame = () => {
        if (!canvas) return;
        const star = new Polygon([
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

`;

c = c.split('    return () => {').join(func + '\\n    return () => {');
fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', c);
console.log('Injected');
