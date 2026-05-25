const fs = require('fs');
const path = require('path');

const directories = ['src', 'server', '.'];
const extensions = ['.tsx', '.ts', '.html', '.json', '.md'];

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(/OmniPortal/g, 'SchoolHub')
                            .replace(/Omniportal/g, 'SchoolHub')
                            .replace(/omniportal/g, 'schoolhub');
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build' || file === '.gemini') continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else {
            if (extensions.some(ext => fullPath.endsWith(ext))) {
                replaceInFile(fullPath);
            }
        }
    }
}

processDirectory('.');
