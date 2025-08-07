const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate a simple icon with text
function generateIcon(size, text) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#1976d2';
  ctx.fillRect(0, 0, size, size);
  
  // Text
  ctx.fillStyle = '#ffffff';
  const fontSize = size / 3;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);
  
  return canvas;
}

// Generate and save icons
const icons = [
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
  { size: 192, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 16, name: 'favicon-16x16.png' },
  { size: 64, name: 'mstile-150x150.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' }
];

icons.forEach(icon => {
  const canvas = generateIcon(icon.size, 'T');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, icon.name), buffer);
  console.log(`Generated ${icon.name}`);
});

// Create favicon.ico
const favicon = generateIcon(32, 'T');
const faviconBuffer = favicon.toBuffer('image/png');
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconBuffer);
console.log('Generated favicon.ico');

// Create manifest.json
const manifest = {
  "name": "Terracottic",
  "short_name": "Terracottic",
  "description": "Your Terracotta Products Store",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
};

fs.writeFileSync(
  path.join(publicDir, 'site.webmanifest'),
  JSON.stringify(manifest, null, 2)
);
console.log('Generated site.webmanifest');
