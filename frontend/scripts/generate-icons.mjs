import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');
mkdirSync(iconsDir, { recursive: true });

const SIZES = [192, 256, 512];

function generateSVG(size) {
  const r = size * 0.2;
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = Math.round(size * 0.28);
  const subFontSize = Math.round(size * 0.09);
  const ringR = Math.round(size * 0.42);
  const dotR = Math.round(size * 0.025);
  const dotY = Math.round(size * 0.82);
  const dotSpacing = Math.round(size * 0.07);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f0f1a;stop-opacity:1" />
    </linearGradient>
    <clipPath id="rounded">
      <rect width="${size}" height="${size}" rx="${r}" ry="${r}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>

  <!-- Outer ring -->
  <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="${Math.round(size * 0.02)}"/>

  <!-- Inner glow circle -->
  <circle cx="${cx}" cy="${cy}" r="${Math.round(size * 0.32)}" fill="rgba(79,70,229,0.25)"/>

  <!-- CIA text -->
  <text x="${cx}" y="${Math.round(cy - size * 0.04)}" 
    font-family="Arial, sans-serif" 
    font-size="${fontSize}" 
    font-weight="900" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="middle"
    letter-spacing="${Math.round(size * 0.01)}">CIA</text>

  <!-- CRYPTO subtitle -->
  <text x="${cx}" y="${Math.round(cy + size * 0.22)}" 
    font-family="Arial, sans-serif" 
    font-size="${subFontSize}" 
    font-weight="600" 
    fill="rgba(255,255,255,0.5)" 
    text-anchor="middle" 
    dominant-baseline="middle"
    letter-spacing="${Math.round(size * 0.015)}">CRYPTO</text>

  <!-- Decorative dots -->
  <circle cx="${cx - dotSpacing * 2}" cy="${dotY}" r="${dotR}" fill="rgba(255,255,255,0.25)"/>
  <circle cx="${cx - dotSpacing}" cy="${dotY}" r="${dotR}" fill="rgba(255,255,255,0.25)"/>
  <circle cx="${cx}" cy="${dotY}" r="${dotR}" fill="#a78bfa"/>
  <circle cx="${cx + dotSpacing}" cy="${dotY}" r="${dotR}" fill="rgba(255,255,255,0.25)"/>
  <circle cx="${cx + dotSpacing * 2}" cy="${dotY}" r="${dotR}" fill="rgba(255,255,255,0.25)"/>
</svg>`;
}

async function main() {
  for (const size of SIZES) {
    const svg = generateSVG(size);
    const svgBuffer = Buffer.from(svg);
    const outPath = join(iconsDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`✅ Generated icon-${size}.png`);
  }
}

main().catch(console.error);