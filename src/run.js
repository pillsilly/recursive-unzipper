const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');
const zipPath = './test/resource/run.zip';
const unzipDir = `${path.dirname(zipPath)}/${path.basename(zipPath).split('.').shift()}`;
createDirIfNotExist(unzipDir)
fs.createReadStream(zipPath)
  .pipe(unzipper.Parse())
  .on('entry', function (entry) {
    const fileName = entry.path;
    const type = entry.type; // 'Directory' or 'File'
    const size = entry.vars.uncompressedSize; // There is also compressedSize;
    const targetPath = `${unzipDir}/${entry.path}`;
    if (entry.type === 'Directory') {
      createDirIfNotExist(targetPath);
    } else { 
      entry.pipe(fs.createWriteStream(targetPath));
    }
    console.log(fileName);
  });

function createDirIfNotExist(toCreateDir) { 
  if (!fs.existsSync(toCreateDir))
    fs.mkdirSync(toCreateDir);
}