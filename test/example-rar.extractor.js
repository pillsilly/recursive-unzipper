const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Extracts a RAR file using the rar CLI via Node.js child_process.spawn.
 * @param {string} filePath - Path to the RAR file.
 * @param {{dir: string}} options - Options containing the destination directory.
 * @returns {Promise<void>}
 */
module.exports = async function extractRar(filePath, options) {
  const destDir = options.dir;
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  return new Promise((resolve, reject) => {
    // Use correct argument order: rar x -o+ <archive> <outputDir/>
    const rar = spawn('rar', ['x', '-o+', filePath, destDir + '/']);
    rar.stdout.on('data', data => {
      process.stdout.write('[rar stdout] ' + data);
    });
    rar.stderr.on('data', data => {
      process.stderr.write('[rar stderr] ' + data);
    });
    rar.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('rar process exited with code ' + code));
      }
    });
    rar.on('error', err => {
      reject(err);
    });
  });
};
