import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '../public');
// Check for either SVG or PNG versions of icons
const requiredIcons = [
  { name: 'android-chrome-192x192', extensions: ['.png', '.svg'] },
  { name: 'android-chrome-512x512', extensions: ['.png', '.svg'] },
  { name: 'apple-touch-icon', extensions: ['.png', '.svg'] },
  { name: 'favicon', extensions: ['.ico'] },
  { name: 'site', extensions: ['.webmanifest'] }
];

// Create public directory if it doesn't exist
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

// Check which required files are missing
const missingFiles = requiredIcons.filter(({name, extensions}) => {
  return !extensions.some(ext => existsSync(join(publicDir, `${name}${ext}`)));
});

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
const stillMissing = requiredIcons.filter(({name, extensions}) => {
  return !extensions.some(ext => existsSync(join(publicDir, `${name}${ext}`)));
});
if (stillMissing.length > 0) {
  console.error('Still missing required PWA assets:', stillMissing.join(', '));
  process.exit(1);
}
