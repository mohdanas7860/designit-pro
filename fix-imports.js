const fs = require('fs');
let c = fs.readFileSync('src/components/Editor/CanvasEditor.tsx', 'utf8');

const regex = /    ImagePlus\r?\n\} from \"lucide-react\";/g;
if (!regex.test(c)) {
    console.log("Regex didn't match.");
} else {
    c = c.replace(regex, `    ImagePlus,
    Triangle as TriangleIcon,
    Minus,
    ZoomIn,
    ZoomOut,
    Maximize,
    AlignTop,
    AlignBottom
} from "lucide-react";`);
    fs.writeFileSync('src/components/Editor/CanvasEditor.tsx', c);
    console.log("Success.");
}
