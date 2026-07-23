const sharp = require('sharp');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'components', 'Group 110.png');
const iconOut = path.join(__dirname, 'assets', 'icon.png');
const adaptiveOut = path.join(__dirname, 'assets', 'adaptive-icon.png');
const splashOut = path.join(__dirname, 'assets', 'splash.png');

async function run() {
  // Main icon: 1024x1024, dark bg, contain (no crop/blurring)
  await sharp(srcPath)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 19, g: 19, b: 19, alpha: 1 }
    })
    .png()
    .toFile(iconOut);
  console.log('✅ icon.png created (1024x1024)');

  // Adaptive icon foreground: 1024x1024, transparent bg, contain
  await sharp(srcPath)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(adaptiveOut);
  console.log('✅ adaptive-icon.png created (1024x1024, transparent bg)');

  // Splash: 2048x2048, dark bg, centered icon at 50%
  await sharp(srcPath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
    .then(iconBuf => {
      return sharp({
        create: {
          width: 2048,
          height: 2048,
          channels: 4,
          background: { r: 19, g: 19, b: 19, alpha: 255 }
        }
      })
        .composite([{ input: iconBuf, gravity: 'center' }])
        .png()
        .toFile(splashOut);
    });
  console.log('✅ splash.png created (2048x2048)');

  // Print sizes
  const { width: iw, height: ih } = await sharp(iconOut).metadata();
  const { width: aw, height: ah } = await sharp(adaptiveOut).metadata();
  console.log(`\nicon.png: ${iw}x${ih}`);
  console.log(`adaptive-icon.png: ${aw}x${ah}`);
  console.log('\nAll icon assets ready in /assets/');
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
