const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');
const _ = require('lodash')
const zipSuffix = '.zip';
var lzma = require('lzma-native');

class ZipExplorer {

  constructor(zipPath) {
    this.processDir = this.processDir.bind(this)
    this.addtoS = this.addtoS.bind(this)
    this.extractLZMACompressedFile = this.extractLZMACompressedFile.bind(this);
    this.zipPath = zipPath;
  }

  async getAllFiles() {
    const buffer = fs.readFileSync(this.zipPath);
    const directory = await unzipper.Open.buffer(buffer);
    const sum = []
    await this.processDir(directory, sum, this.zipPath)
    return sum;
  }

  async extractLZMACompressedFile(buffer, destPath) {
    const promise = new Promise(resolve => {
      lzma.decompress(buffer, function (decompressedResult) {
        fs.writeFile(path.resolve(destPath), decompressedResult, () => {
          resolve()
        })
      });
    });
    return promise;
  }

  async processDir(directory, sum, zipPath) {
    directory.files.forEach(f => {
      f.parentPath = zipPath
      f.extractToDefault = async () => {
        let folder = _.replace(path.resolve(`${f.parentPath}`), /\.zip/g, '_zip');
        createDirIfNotExist(folder);
        const buffer = await f.buffer();
        if (f.isXZ) {
          await this.extractLZMACompressedFile(buffer, `${folder}/${f.path.replace('.xz', '')}`)
        } else {
          fs.writeFileSync(`${folder}/${f.path}`, buffer);
        }
      }
      f.isZip = isZip(f);
      f.isXZ = isXZ(f)
    })
    sum.push(...directory.files);
    const subzips = directory.files.filter(isZip);

    return Promise.all(subzips.map(zip => this.addtoS(sum)(zip)));
  }

  addtoS(sum) {
    return async (zip) => {
      const buffer = await zip.buffer();
      const directory = await unzipper.Open.buffer(buffer);
      await this.processDir(directory, sum, `${zip.parentPath}/${zip.path}`);
    }
  }
}

module.exports = {
  ZipExplorer
}

function isZip(file) {
  return file.path && (file.path.endsWith(zipSuffix)
  )
}

function isXZ(file) {
  return file.path && file.path.endsWith('.xz');
}

function createDirIfNotExist(toCreateDir) {
  console.log(`creating dir ${toCreateDir}`)
  if (!fs.existsSync(toCreateDir))
    fs.mkdirSync(toCreateDir, {recursive: true});
}
