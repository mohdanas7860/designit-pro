const fs = require('fs');
let c = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

const s1 = 'let snapLines: FabricObject[] = [];';
const s2 = 'initCanvas.on("mouse:up", clearSnapLines);';

const firstSnap = c.indexOf(s1);
const secondSnap = c.indexOf(s1, firstSnap + 1);

let fixed = c;
if (secondSnap > -1) {
    const endSnap = c.indexOf(s2, secondSnap) + s2.length;
    fixed = c.substring(0, secondSnap) + c.substring(endSnap);
}

fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', fixed);
console.log('Fixed dupes');
