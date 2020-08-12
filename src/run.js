const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');
const zipPath = './src/run.zip';
const unzipDir = `${path.dirname(zipPath)}/${path.basename(zipPath).split('.').shift()}`;
fs.mkdirSync(unzipDir);
fs.createReadStream(zipPath)
  .pipe(unzipper.Parse())
  .on('entry', function (entry) {
    const fileName = entry.path;
    const type = entry.type; // 'Directory' or 'File'
    const size = entry.vars.uncompressedSize; // There is also compressedSize;
    if (entry.type === 'Directory') {
      fs.mkdirSync(`${unzipDir}/${entry.path}`)
    } else { 
      
    }

      console.log(fileName);
    // if (fileName === "this IS the file I'm looking for") {
    //   entry.pipe(fs.createWriteStream('output/path'));
    // } else {
    //   entry.autodrain();
    // }
  });