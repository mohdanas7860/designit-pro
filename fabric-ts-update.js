const fs = require('fs');

let content = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

// 1. setActiveObject TS issue
content = content.replace(/setActiveObject\(cvs.getActiveObject\(\)\);/g, 'setActiveObject(cvs.getActiveObject() || null);');

// 2. toJSON TS issues (ignore arguments)
content = content.replace(/cvs.toJSON\(\["name", "visible", "lockMovementX", "lockMovementY", "lockRotation", "lockScalingX", "lockScalingY", "selectable", "hasControls"\]\)/g, '(cvs as any).toJSON(["name", "visible", "lockMovementX", "lockMovementY", "lockRotation", "lockScalingX", "lockScalingY", "selectable", "hasControls"])');
content = content.replace(/canvas.toJSON\(\["name"\]\)/g, '(canvas as any).toJSON(["name"])');

// 3. clone Promise issue - active object
content = content.replace(/active.clone\(\(cloned: FabricObject\) => \{\n            clipboard.current = cloned;\n        \}, \["name"\]\);/g, `active.clone(["name"]).then((cloned: FabricObject) => {
            clipboard.current = cloned;
        });`);

// 4. clone Promise issue - paste clipboard
content = content.replace(/clipboard.current.clone\(\(clonedObj: FabricObject\) => \{\n/g, 'clipboard.current.clone(["name"]).then((clonedObj: FabricObject) => {\n');
content = content.replace(/            saveHistory\(canvas\);\n        \}, \["name"\]\);/g, '            saveHistory(canvas);\n        });');


// 5. fromURL Promise issue
content = content.replace(/FabricImage.fromURL\(data, \(img: any\) => \{\n/g, 'FabricImage.fromURL(data as string).then((img: any) => {\n');
content = content.replace(/                saveHistory\(canvas\);\n            \}\);\n        \};\n        reader.readAsDataURL\(file\);/g, '                saveHistory(canvas);\n            });\n        };\n        reader.readAsDataURL(file);');

// 6. canvas.bringForward -> canvas.bringObjectForward, or obj.bringForward()
// Wait, we can cast canvas to any:
content = content.replace(/canvas.bringForward\(obj\);/g, '(canvas as any).bringObjectForward(obj);');
content = content.replace(/canvas.sendBackwards\(obj\);/g, '(canvas as any).sendObjectBackwards(obj);');

fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', content);
console.log("Fixes applied");
