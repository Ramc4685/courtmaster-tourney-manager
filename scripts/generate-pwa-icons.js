import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ICON_SIZES = [192, 512];
const SOURCE_ICON = path.join(process.cwd(), 'src', 'assets', 'logo.svg');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

async function generateIcons() {
  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Generate regular icons
  for (const size of ICON_SIZES) {
    await sharp(SOURCE_ICON)
      .resize(size, size)
      .png()
      .toFile(path.join(PUBLIC_DIR, `icon-${size}.png`));
  }

  // Generate maskable icon (with padding for safe area)
  await sharp(SOURCE_ICON)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 79, g: 70, b: 229, alpha: 1 } // #4F46E5
    })
    .extend({
      top: 64,
      bottom: 64,
      left: 64,
      right: 64,
      background: { r: 79, g: 70, b: 229, alpha: 1 }
    })
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'icon-512-maskable.png'));
}

generateIcons().catch(console.error); 