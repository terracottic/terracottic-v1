/**
 * Service Worker Manifest Generator
 * 
 * This script generates a manifest file for the service worker,
 * which includes all the assets that should be precached.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = require('glob');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const globAsync = promisify(glob);

// Configuration
const BUILD_DIR = path.join(__dirname, '..', 'dist');
const MANIFEST_FILE = path.join(__dirname, '..', 'public', 'precache-manifest.json');
const SW_CONFIG_FILE = path.join(__dirname, '..', 'src', 'config', 'serviceWorkerConfig.js');

// File patterns to include in the precache manifest
const INCLUDE_PATTERNS = [
  '**/*.{js,css,html,json,png,jpg,jpeg,gif,svg,webp,avif,ico,woff,woff2,ttf,eot,mp4,webm,ogg,mp3,wav,flac,aac,wasm,pdf,txt,webmanifest}',
  '!**/*.map',
  '!**/*.br',
  '!**/*.gz',
  '!**/*.DS_Store',
  '!**/node_modules/**',
  '!**/sw.js',
  '!**/workbox-*.js',
  '!**/workbox-*.js.map',
];

// Get the current timestamp for cache busting
const timestamp = Date.now();

/**
 * Generate a revision string for a file
 */
async function getFileRevision(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.mtime.getTime().toString(16);
  } catch (error) {
    console.warn(`Could not get file stats for ${filePath}:`, error);
    return timestamp.toString(16);
  }
}

/**
 * Generate the precache manifest
 */
async function generateManifest() {
  console.log('Generating service worker precache manifest...');
  
  // Find all files matching the include patterns
  const files = await globAsync(INCLUDE_PATTERNS, {
    cwd: BUILD_DIR,
    nodir: true,
    absolute: true,
    ignore: ['**/precache-manifest.*.js', '**/service-worker.js', '**/workbox-*'],
  });
  
  console.log(`Found ${files.length} files to precache`);
  
  // Generate manifest entries
  const manifestEntries = await Promise.all(
    files.map(async (file) => {
      const url = path.relative(BUILD_DIR, file).replace(/\\/g, '/');
      const revision = await getFileRevision(file);
      
      return {
        url: `/${url}`,
        revision,
      };
    })
  );
  
  // Sort entries by URL for consistent output
  manifestEntries.sort((a, b) => a.url.localeCompare(b.url));
  
  // Create the manifest object
  const manifest = {
    // Add a timestamp to the manifest for cache busting
    timestamp,
    
    // Add the precache manifest entries
    precache: manifestEntries,
    
    // Add the service worker configuration
    config: await getServiceWorkerConfig(),
  };
  
  // Write the manifest file
  await writeFile(
    MANIFEST_FILE,
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`Service worker precache manifest generated at ${MANIFEST_FILE}`);
  
  return manifest;
}

/**
 * Get the service worker configuration
 */
async function getServiceWorkerConfig() {
  try {
    // Read the service worker config file
    const configContent = await readFile(SW_CONFIG_FILE, 'utf8');
    
    // Extract the configuration object using a simple regex
    const configMatch = configContent.match(/export\s+default\s+({[\s\S]*?});/);
    
    if (configMatch && configMatch[1]) {
      // Convert the config object to a string and evaluate it in a safe way
      const configStr = `(${configMatch[1]})`;
      return eval(configStr); // eslint-disable-line no-eval
    }
    
    console.warn('Could not extract service worker configuration');
    return {};
  } catch (error) {
    console.warn('Error reading service worker configuration:', error);
    return {};
  }
}

// Run the generator
if (require.main === module) {
  generateManifest().catch((error) => {
    console.error('Error generating service worker manifest:', error);
    process.exit(1);
  });
}

module.exports = generateManifest;
