import lzma from 'lzma-native';
import fs from 'fs';
import assert from 'assert';

export default function exampleTarExtractor(inputPath, {dir: outPutPath}) {
  // make sure that, in this function, all extractable files are extracted to the dir of options.dir
  return new Promise((resolve, reject) => {
    const binaryPath = outPutPath + '/' + unwrapXzExtension(inputPath);
    const output = fs
      .createWriteStream(binaryPath)
      .on('close', resolve) // if transform stream and input stream don't go wrong, then it's always OK to resolve when ouput stream is closed.
      .on('error', (e) => {
        logger.error(`writing lzma data to disk gone wrong: ${e.stack}`);
        if (this.bail) {
          reject(new Error(getFailedToExtractMessage(inputPath)));
        } else {
          resolve(); // if it's not bail, then resolve when the writer stream goes wrong: e.g disk is full.
        }
      });
    const input = fs.createReadStream(inputPath);
    const transform = lzma.createDecompressor({threads: 1, synchronous: true}).on('error', (e) => {
      logger.error(`lzma Decompressor error ${e.stack}`);
      if (this.bail) {
        reject(new Error(getFailedToExtractMessage(inputPath)));
      } else {
        assert(false, `lzma Decompressor error ${e.stack}`);
        resolve();
      } // if it's not bail, then leave the resolve timing to the writer stream: line 87
    });
    input.pipe(transform).pipe(output);
  });

  function unwrapXzExtension(fileName) {
    return fileName.toLowerCase().replace('.xz', '').split('/').pop();
  }
}
