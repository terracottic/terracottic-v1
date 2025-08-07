const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const publicDir = path.join(__dirname, '../public');
const requiredIcons = [
  'android-chrome-192x192.svg',
  'android-chrome-512x512.svg',
  'apple-touch-icon.svg',
  'favicon.ico',
  'site.webmanifest'
];

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

// Check which required files are missing
const missingFiles = requiredIcons.filter(file => !fs.existsSync(path.join(publicDir, file)));

if (missingFiles.length > 0) {
  console.log('Missing PWA assets, generating them now...');
  
  // Run the PWA assets generation script
  try {
    execSync('node ./scripts/generate-pwa-assets-simple.mjs', { stdio: 'inherit' });
    console.log('Successfully generated PWA assets');
  } catch (error) {
    console.error('Failed to generate PWA assets:', error.message);
    process.exit(1);
  }
} else {
  console.log('All required PWA assets are present');
}

// Verify all required files exist after generation
const stillMissing = requiredIcons.filter(file => !fs.existsSync(path.join(publicDir, file)));
if (stillMissing.length > 0) {
  console.error('Still missing required PWA assets:', stillMissing.join(', '));
  process.exit(1);
}
