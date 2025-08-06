import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { glob } from 'glob';

import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const globAsync = promisify(glob);

const CONFIG = {
  SUPPORTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif'],
  OUTPUT_FORMATS: [
    { ext: '.webp', options: { quality: 80, effort: 6 } },
    { ext: '.avif', options: { quality: 70, effort: 5 } },
  ],
  WIDTHS: [320, 640, 768, 1024, 1280, 1536, 1920],
  MAX_DIMENSION: 3840,
  SKIP_EXISTING: true,
  VERBOSE: true,
};

const stats = {
  totalProcessed: 0,
  totalSkipped: 0,
  totalErrors: 0,
  formats: {},
  sizes: {},
  startTime: Date.now(),
};

function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex').substring(0, 8);
}

async function processImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath, ext);
  const dirName = path.dirname(filePath);
  const relativePath = path.relative(process.cwd(), filePath);

  try {
    const metadata = await sharp(filePath).metadata();
    const { width } = metadata;

    if (!CONFIG.SUPPORTED_EXTENSIONS.includes(ext)) {
      if (CONFIG.VERBOSE) {
        console.log(`Skipping unsupported format: ${relativePath}`);
      }
      return;
    }

    const targetDimensions = CONFIG.WIDTHS.filter(w => w <= Math.min(width, CONFIG.MAX_DIMENSION)).sort((a, b) => a - b);
    if (width <= CONFIG.MAX_DIMENSION && !targetDimensions.includes(width)) {
      targetDimensions.push(width);
    }

    for (const output of CONFIG.OUTPUT_FORMATS) {
      await generateVersions(filePath, dirName, fileName, ext, targetDimensions, output);
    }

    stats.totalProcessed++;
  } catch (error) {
    console.error(`Error processing ${relativePath}:`, error.message);
    stats.totalErrors++;
  }
}

async function generateVersions(filePath, dirName, baseName, srcExt, widths, output) {
  const formatStats = stats.formats[output.ext] || (stats.formats[output.ext] = { processed: 0, skipped: 0 });

  for (const width of widths) {
    const destFileName = `${baseName}-${width}w${output.ext}`;
    const destPath = path.join(dirName, destFileName);
    stats.sizes[width] = (stats.sizes[width] || 0) + 1;

    if (CONFIG.SKIP_EXISTING && await fileExists(destPath)) {
      const srcStats = await fs.stat(filePath);
      const destStats = await fs.stat(destPath);
      if (destStats.mtime > srcStats.mtime) {
        if (CONFIG.VERBOSE) {
          console.log(`Skipping existing: ${path.relative(process.cwd(), destPath)}`);
        }
        formatStats.skipped = (formatStats.skipped || 0) + 1;
        stats.totalSkipped++;
        continue;
      }
    }

    try {
      const sharpInstance = sharp(filePath);
      if (width) {
        sharpInstance.resize({ width, withoutEnlargement: true, fit: 'inside' });
      }

      switch (output.ext) {
        case '.webp':
          await sharpInstance.webp(output.options).toFile(destPath);
          break;
        case '.avif':
          await sharpInstance.avif(output.options).toFile(destPath);
          break;
        default:
          throw new Error(`Unsupported output format: ${output.ext}`);
      }

      if (CONFIG.VERBOSE) {
        console.log(`Generated: ${path.relative(process.cwd(), destPath)}`);
      }

      formatStats.processed = (formatStats.processed || 0) + 1;
    } catch (error) {
      console.error(`Error generating ${destPath}:`, error.message);
      stats.totalErrors++;
    }
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function processDirectory(dir) {
  const pattern = `**/*{${CONFIG.SUPPORTED_EXTENSIONS.join(',')}}`;
  const files = await globAsync(pattern, {
    cwd: dir,
    nodir: true,
    ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/public/**/original/**'],
  });

  console.log(`Found ${files.length} images to process in ${path.relative(process.cwd(), dir)}`);

  for (const file of files) {
    await processImage(path.resolve(dir, file));
  }
}

function printStats() {
  const duration = (Date.now() - stats.startTime) / 1000;

  console.log('\n--- Image Optimization Complete ---');
  console.log(`Processed: ${stats.totalProcessed} images`);
  console.log(`Skipped: ${stats.totalSkipped} already optimized`);
  console.log(`Errors: ${stats.totalErrors}`);
  console.log(`Time: ${duration.toFixed(2)}s`);

  if (Object.keys(stats.formats).length > 0) {
    console.log('\nFormats:');
    for (const [format, data] of Object.entries(stats.formats)) {
      console.log(`  ${format}: ${data.processed || 0} generated, ${data.skipped || 0} skipped`);
    }
  }

  if (Object.keys(stats.sizes).length > 0) {
    console.log('\nSizes:');
    const sortedSizes = Object.entries(stats.sizes)
      .map(([width, count]) => ({ width: parseInt(width), count }))
      .sort((a, b) => a.width - b.width);

    for (const { width, count } of sortedSizes) {
      console.log(`  ${width}w: ${count} images`);
    }
  }

  console.log('----------------------------------\n');
}

export async function main() {
  try {
    const directories = [
      path.join(process.cwd(), 'public'),
      path.join(process.cwd(), 'src', 'assets'),
    ];

    for (const dir of directories) {
      if (await fileExists(dir)) {
        await processDirectory(dir);
      }
    }

    printStats();
  } catch (error) {
    console.error('Error during image optimization:', error);
    process.exit(1);
  }
}

// ESM-compatible check for direct script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error in main execution:', error);
    process.exit(1);
  });
}

// Optional named exports if importing in other scripts
export { processImage, processDirectory };
