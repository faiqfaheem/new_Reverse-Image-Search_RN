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

  // Adaptive icon foreground: 1024x1024 canvas, icon scaled to 666x666 (safe zone ~66% of 1024px)
  const resizedIconBuf = await sharp(srcPath)
    .resize(666, 666, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: resizedIconBuf, gravity: 'center' }])
    .png()
    .toFile(adaptiveOut);
  console.log('✅ adaptive-icon.png created (1024x1024 with 666x666 safe zone icon, transparent bg)');

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

  // Regenerate Native Android Mipmaps
  const densities = [
    { folder: 'mipmap-mdpi', iconSize: 48, fgSize: 108, innerSize: 70 },
    { folder: 'mipmap-hdpi', iconSize: 72, fgSize: 162, innerSize: 105 },
    { folder: 'mipmap-xhdpi', iconSize: 96, fgSize: 216, innerSize: 140 },
    { folder: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324, innerSize: 210 },
    { folder: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432, innerSize: 280 },
  ];

  for (const d of densities) {
    const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', d.folder);
    
    // ic_launcher.webp (Legacy / standalone full icon with dark bg)
    await sharp(srcPath)
      .resize(d.iconSize, d.iconSize, { fit: 'contain', background: { r: 19, g: 19, b: 19, alpha: 1 } })
      .webp()
      .toFile(path.join(resDir, 'ic_launcher.webp'));
      
    await sharp(srcPath)
      .resize(d.iconSize, d.iconSize, { fit: 'contain', background: { r: 19, g: 19, b: 19, alpha: 1 } })
      .webp()
      .toFile(path.join(resDir, 'ic_launcher_round.webp'));

    // ic_launcher_foreground.webp (Adaptive foreground with safe-zone padding)
    const innerBuf = await sharp(srcPath)
      .resize(d.innerSize, d.innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: d.fgSize,
        height: d.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: innerBuf, gravity: 'center' }])
      .webp()
      .toFile(path.join(resDir, 'ic_launcher_foreground.webp'));
  }
  console.log('✅ Android mipmap native .webp icons regenerated with safe zone!');
  console.log('\nAll icon assets ready in /assets/ & /android/res/');
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
