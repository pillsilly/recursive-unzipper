const unZipper = require('unzipper');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const ZIP_SUFFIX = '.zip';
const lzma = require('lzma-native');

class ZipExplorer {

  constructor(zipPath) {
    this.prepareFile = this.prepareFile.bind(this);
    this.openZip = this.openZip.bind(this);
    this.extractLZMACompressedFile = this.extractLZMACompressedFile.bind(this);
    this.extractToDefault = this.extractToDefault.bind(this);
    this.zipPath = zipPath;
  }

  async getAllFiles() {
    const buffer = fs.readFileSync(this.zipPath);
    const directory = await unZipper.Open.buffer(buffer);
    const sum = [];
    await this.prepareFile(directory, sum, this.zipPath);
    return sum;
  }

  async extractLZMACompressedFile(buffer, destPath) {
    return new Promise(resolve => {
      lzma.decompress(buffer, function (decompressedResult) {
        fs.writeFile(path.resolve(destPath), decompressedResult, () => {
          resolve()
        })
      });
    });
  }

  async prepareFile(directory, sum, zipPath) {
    directory.files.forEach(file => {
      file.parentPath = zipPath;
      file.isZip = isZip(file);
      file.isXZ = isXZ(file);
      file.extractToDefault = this.extractToDefault(file);
    });
    sum.push(...directory.files);
    const zipFiles = directory.files.filter(isZip);

    return Promise.all(zipFiles.map(this.openZip(sum)));
  }

  extractToDefault(file) {
    return async () => {
      let folder = _.replace(path.resolve(`${file.parentPath}`), /\.zip/g, '_zip');
      createDirIfNotExist(folder);
      const buffer = await file.buffer();
      if (file.isXZ) {
        await this.extractLZMACompressedFile(buffer, `${folder}/${file.path.replace('.xz', '')}`)
      } else {
        await fs.writeFileSync(`${folder}/${file.path}`, buffer);
      }
    }
  }

  openZip(sum) {
    return async (zip) => {
      const buffer = await zip.buffer();
      const directory = await unZipper.Open.buffer(buffer);
      await this.prepareFile(directory, sum, `${zip.parentPath}/${zip.path}`);
    }
  }
}

module.exports = {
  ZipExplorer
};

function isZip(file) {
  return file.path && (file.path.endsWith(ZIP_SUFFIX))
}

function isXZ(file) {
  return file.path && file.path.endsWith('.xz');
}


function createDirIfNotExist(toCreateDir) {
  console.log(`Creating dir ${toCreateDir}`);
  if (!fs.existsSync(toCreateDir))
    fs.mkdirSync(toCreateDir, {recursive: true});
}
