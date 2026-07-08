const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const iconSrc = 'C:\\Users\\inspy\\.gemini\\antigravity\\brain\\9dde9e56-20d4-4afe-84de-ff9b0ce5cf3c\\skoola_icon_1782485649413.png';
const logoSrc = 'C:\\Users\\inspy\\.gemini\\antigravity\\brain\\9dde9e56-20d4-4afe-84de-ff9b0ce5cf3c\\skoola_full_logo_1782485664005.png';

const iconDest = path.join(__dirname, '../public/assets/skoola_icon.png');
const logoDest = path.join(__dirname, '../public/assets/skoola_full_logo.png');

function makeTransparent(image) {
  // We want to turn the black background (or very dark gray pixels) into transparent.
  // We will scan all pixels and if the color is close to black, set its alpha to 0.
  // To avoid rough edges, we can do a threshold check.
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // Check if the pixel is near-black.
    // Stable Diffusion/ImageGen black backgrounds are usually pure black (0,0,0) or very dark.
    if (r < 25 && g < 25 && b < 25) {
      // Set alpha to 0
      this.bitmap.data[idx + 3] = 0;
    }
  });
  return image;
}

async function process() {
  console.log('Processing icon...');
  const icon = await Jimp.read(iconSrc);
  makeTransparent(icon);
  icon.autocrop();
  // Ensure the directory exists
  fs.mkdirSync(path.dirname(iconDest), { recursive: true });
  await icon.writeAsync(iconDest);
  console.log('Icon written to:', iconDest);

  console.log('Processing logo...');
  const logo = await Jimp.read(logoSrc);
  makeTransparent(logo);
  logo.autocrop();
  await logo.writeAsync(logoDest);
  console.log('Logo written to:', logoDest);
}

process().catch(err => {
  console.error('Error processing images:', err);
});
