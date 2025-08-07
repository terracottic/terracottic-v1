import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create public directory if it doesn't exist
const publicDir = join(__dirname, '..', 'public');
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Simple SVG icon generator
function generateSvgIcon(size, text) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1976d2"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size / 3}" 
        fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;
}

// Generate and save icons
const icons = [
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 16, name: 'favicon-16x16.png' },
  { size: 150, name: 'mstile-150x150.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' }
];

// Create a simple favicon.ico
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#1976d2"/>
  <text x="50%" y="50%" font-family="Arial" font-size="12" 
        fill="white" text-anchor="middle" dominant-baseline="middle">T</text>
</svg>`;

// Save favicon.ico
writeFileSync(join(publicDir, 'favicon.ico'), faviconSvg);
console.log('Generated favicon.ico');

// Save SVG icons
icons.forEach(icon => {
  const svgContent = generateSvgIcon(icon.size, 'T');
  const fileName = icon.name.endsWith('.png') ? 
    join(publicDir, icon.name.replace('.png', '.svg')) : 
    join(publicDir, icon.name);
  
  writeFileSync(fileName, svgContent);
  console.log(`Generated ${fileName}`);
});

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
      "src": "/android-chrome-192x192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    },
    {
      "src": "/android-chrome-512x512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml"
    }
  ]
};

writeFileSync(
  join(publicDir, 'site.webmanifest'),
  JSON.stringify(manifest, null, 2)
);
console.log('Generated site.webmanifest');

// Create a simple index.html for testing
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terracottic</title>
  <link rel="icon" href="/favicon.ico">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#1976d2">
</head>
<body>
  <h1>Terracottic PWA</h1>
  <p>PWA assets have been generated successfully!</p>
</body>
</html>`;

writeFileSync(join(publicDir, 'index.html'), indexHtml);
console.log('Generated test index.html');
