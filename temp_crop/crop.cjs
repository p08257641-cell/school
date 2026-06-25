const Jimp = require('jimp');
const path = require('path');

async function autoCropFavicon() {
  const iconPath = path.join(__dirname, '../public/assets/skoola_icon.png');
  const image = await Jimp.read(iconPath);
  
  // Crop the image to remove transparent boundaries
  image.autocrop();
  
  // Optionally, we can resize it nicely for a favicon, but autocrop is usually enough.
  await image.writeAsync(iconPath);
  console.log('Icon successfully autocropped!');
}

autoCropFavicon().catch(console.error);
