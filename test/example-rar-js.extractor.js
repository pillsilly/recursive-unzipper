const fs = require('fs');
const path = require('path');
const unrar = require('node-unrar-js');

/**
 * Extracts a RAR file using node-unrar-js (pure JavaScript, no CLI).
 * @param {string} filePath - Path to the RAR file.
 * @param {{dir: string}} options - Options containing the destination directory.
 * @returns {Promise<void>}
 */
module.exports = async function extractRarJs(filePath, options) {
  const destDir = options.dir;
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  // Read the RAR file into a Uint8Array and get its buffer
  const rarBuffer = Uint8Array.from(fs.readFileSync(filePath)).buffer;
  // Use official API: createExtractorFromData
  const extractor = await unrar.createExtractorFromData({ data: rarBuffer });
  const fileList = extractor.getFileList();
  console.log('[node-unrar-js] File list:', fileList);
  const entries = fileList.fileHeaders;
  if (!entries || entries.length === 0) {
    throw new Error('No entries found in RAR archive');
  }
  for (const entry of entries) {
    if (entry.flags.directory) continue; // skip directories
    // Extract the file using the official API
    const extracted = extractor.extract({ files: [entry.name] });
    if (!extracted || !extracted.files || !extracted.files[0] || !extracted.files[0].extraction) continue;
    const fileData = extracted.files[0].extraction;
    // Ensure output path is normalized and safe
    const outPath = path.resolve(destDir, entry.name);
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(outPath, Buffer.from(fileData));
    console.log('[node-unrar-js] Extracted:', entry.name, 'to', outPath);
  }
};
