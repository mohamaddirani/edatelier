import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import pkg from 'glob';
const { glob } = pkg; // or just use pkg directly as `glob`

const cwd = process.cwd();
const INPUT_DIR = path.join(cwd, 'assets', 'images', 'original');
const OUTPUT_DIR = path.join(cwd, 'public', 'images', 'optimized');
const MANIFEST_PATH = path.join(cwd, 'public', 'images', 'manifest.json');

const SIZES = [320, 640, 1024, 2048];

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function main() {
  // If there are no source images, skip optimization (do not fail the build).
  if (!fs.existsSync(INPUT_DIR)) {
    console.log(`[optimize-images] No input directory found at ${INPUT_DIR}. Skipping image optimization.`);
    return;
  }

  await ensureDir(OUTPUT_DIR);

  const files = await glob('**/*.{jpg,jpeg,png,webp}', { cwd: INPUT_DIR, nodir: true });
  if (!files || files.length === 0) {
    console.log('[optimize-images] No images found to process. Exiting.');
    return;
  }

  const manifest = {};

  for (const relative of files) {
    try {
      const inputPath = path.join(INPUT_DIR, relative);
      const baseName = path.parse(relative).name.replace(/\s+/g, '-');
      const outDirForFile = path.join(OUTPUT_DIR, baseName);
      await ensureDir(outDirForFile);

      const variants = [];
      for (const w of SIZES) {
        const outFilename = `${baseName}-${w}.webp`;
        const outPath = path.join(outDirForFile, outFilename);
        try {
          await sharp(inputPath)
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toFile(outPath);
          variants.push({ width: w, url: `/images/optimized/${baseName}/${outFilename}` });
        } catch (err) {
          console.warn(`[optimize-images] Failed to create variant ${w} for ${relative}:`, err?.message || err);
        }
      }

      // tiny blurred placeholder
      let placeholder = null;
      try {
        const buf = await sharp(inputPath).resize(20).webp({ quality: 40 }).toBuffer();
        placeholder = `data:image/webp;base64,${buf.toString('base64')}`;
      } catch (err) {
        console.warn(`[optimize-images] Failed to create placeholder for ${relative}:`, err?.message || err);
      }

      const largest = variants.length ? variants[variants.length - 1].width : null;
      const src = variants.length ? variants[variants.length - 1].url : null;

      manifest[baseName] = {
        src,
        variants,
        placeholder,
        width: largest,
      };

      console.log(`[optimize-images] Processed ${relative} -> ${variants.length} variants`);
    } catch (err) {
      console.error(`[optimize-images] Unexpected error processing ${relative}:`, err?.message || err);
    }
  }

  await ensureDir(path.dirname(MANIFEST_PATH));
  await fs.promises.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[optimize-images] Wrote manifest to ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error('[optimize-images] Fatal error:', err?.message || err);
  process.exitCode = 1;
});
