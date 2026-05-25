const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'index.html',
  'src/components/LandingPage.tsx',
  'src/components/Layout.tsx',
  'src/components/Login.tsx',
  'src/components/PartnerDashboard.tsx',
  'src/components/PartnerLogin.tsx'
];

for (const file of filesToUpdate) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let newContent = content
      .replace(/omni_portal_full_logo\.png/g, 'schoolhub_full_logo.png')
      .replace(/omni_portal_icon\.png/g, 'schoolhub_icon.png')
      .replace(/Omni/g, 'SchoolHub');
    
    if (content !== newContent) {
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
}
