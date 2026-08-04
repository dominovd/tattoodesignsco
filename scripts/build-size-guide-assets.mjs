import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from '/Users/denis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/lib/index.js';

const sourceRoot = '/Users/denis/.codex/generated_images/019fc16a-bb77-7cf3-9be6-57876a408f70';
const outputRoot = new URL('../public/images/tools/', import.meta.url);

const sources = {
  'wrist-3cm': 'exec-ca388480-e023-4326-adb4-28eb45a95534.png',
  'wrist-5cm': 'exec-9a87ab12-df72-4d3d-90c6-5aaa14036a2b.png',
  'wrist-10cm': 'exec-d3d7df10-8691-469a-b499-780586415db3.png',
  'arm-5cm': 'exec-122bb5aa-4695-4597-88ad-b0a0ff3beda6.png',
  'arm-10cm': 'exec-cad6f1da-4a4b-4541-bc6d-827c48acaf46.png',
  'arm-15cm': 'exec-91c592a9-8388-4a2e-a19a-f9b80e1253ec.png',
};

const sizes = [
  [400, 600, 78],
  [800, 1200, 82],
  [1200, 1800, 85],
];

await fs.mkdir(outputRoot, { recursive: true });

let created = 0;
for (const [name, source] of Object.entries(sources)) {
  for (const [width, height, quality] of sizes) {
    const output = fileURLToPath(new URL(`${name}-${width}.webp`, outputRoot));
    await sharp(path.join(sourceRoot, source))
      .resize(width, height, { fit: 'cover', position: 'attention' })
      .webp({ quality, effort: 5 })
      .toFile(output);
    created += 1;
  }
}

console.log(`Created ${created} size-guide WebP files`);
