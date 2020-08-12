const unzipper = require('unzipper');
const fs = require('fs');

fs.createReadStream('./src/run.zip')
  .pipe(unzipper.Parse())
  .on('entry', function (entry) {
    const fileName = entry.path;
    const type = entry.type; // 'Directory' or 'File'
      const size = entry.vars.uncompressedSize; // There is also compressedSize;
      console.log(fileName);
    // if (fileName === "this IS the file I'm looking for") {
    //   entry.pipe(fs.createWriteStream('output/path'));
    // } else {
    //   entry.autodrain();
    // }
  });