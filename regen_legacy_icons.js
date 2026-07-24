const sharp = require('sharp');
const path = require('path');

const configs = [
  { dir: 'mipmap-mdpi',    size: 48 },
  { dir: 'mipmap-hdpi',    size: 72 },
  { dir: 'mipmap-xhdpi',   size: 96 },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const baseDir = 'android/app/src/main/res';
const sourceIcon = 'assets/icon.png';
const BG = { r: 19, g: 19, b: 19, alpha: 255 };

async function regenerateLegacy() {
  for (const { dir, size } of configs) {
    const squarePath = path.join(baseDir, dir, 'ic_launcher.webp');
    const roundPath  = path.join(baseDir, dir, 'ic_launcher_round.webp');

    // Square icon with dark background
    await sharp(sourceIcon)
      .resize(size, size, { fit: 'contain', background: BG })
      .flatten({ background: { r: 19, g: 19, b: 19 } })
      .webp({ quality: 90 })
      .toFile(squarePath);

    // Round icon — circular SVG mask
    const r = Math.floor(size / 2);
    const circleSvg = Buffer.from(
      `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${r}" cy="${r}" r="${r}"/></svg>`
    );
    await sharp(sourceIcon)
      .resize(size, size, { fit: 'contain', background: BG })
      .flatten({ background: { r: 19, g: 19, b: 19 } })
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .webp({ quality: 90 })
      .toFile(roundPath);

    console.log('Legacy icons done:', dir, `${size}x${size}`);
  }
  console.log('All legacy icons regenerated!');
}

regenerateLegacy().catch(console.error);
