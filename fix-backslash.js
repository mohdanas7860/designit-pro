const fs = require('fs');
let c = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');
c = c.replace(/\\`/g, '`');
fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', c);
console.log('Fixed backslashes');
