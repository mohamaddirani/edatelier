const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

const INPUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'original');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'optimized');
const MANIFEST_PATH = path.join(__dirname, '..', 'public', 'images', 'manifest.json');

const SIZES = [320, 640, 1024, 2048];

if (!fs.existsSync(INPUT_DIR)) {
  console.error(`Input directory not found: ${INPUT_DIR}`);
  process.exit(1);
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  const files = glob.sync('**/*.{jpg,jpeg,png,webp}', { cwd: INPUT_DIR });
  const manifest = {};

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const baseName = path.parse(file).name;
    const outDirForFile = path.join(OUTPUT_DIR, baseName);
    fs.mkdirSync(outDirForFile, { recursive: true });

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
        console.error(`Failed to process ${inputPath} -> ${outPath}`, err);
      }
    }

    const tinyOut = await sharp(inputPath)
      .resize(20)
      .webp({ quality: 40 })
      .toBuffer();
    const lqip = `data:image/webp;base64,${tinyOut.toString('base64')}`;

    const largest = variants.length ? variants[variants.length - 1].width : null;
    const src = variants.length ? variants[variants.length - 1].url : null;

    manifest[baseName] = {
      src,
      variants,
      placeholder: lqip,
      width: largest,
    };

    console.log(`Processed: ${file} -> ${variants.length} variants`);
  }

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Wrote manifest: ${MANIFEST_PATH}`);
})();
