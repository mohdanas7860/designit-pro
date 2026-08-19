const fs = require('fs');
let uiJS = fs.readFileSync('ui-layout.js', 'utf8');
const searchStr = 'const UI = `';
const startIndex = uiJS.indexOf(searchStr) + searchStr.length;
const endIndex = uiJS.lastIndexOf('`;');
const UI = uiJS.substring(startIndex, endIndex);

let code = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');
const rIdx = code.search(/    return \(\r?\n/);
code = code.substring(0, rIdx) + UI;
fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', code);
console.log('Appended fully');
