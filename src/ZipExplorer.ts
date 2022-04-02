import unZipper, {File} from 'unzipper';
import fs from 'fs';
import path from 'path';
import * as _ from 'lodash';
import lzma from 'lzma-native';

const ZIP_SUFFIX = '.zip';
export type MyFileType = {
  path: string
  parentPath: string
  isZip: boolean
  isXZ: boolean
  type: string
  extractToDefault: any
} & unZipper.File
export class ZipExplorer {

  constructor(private readonly zipPath: string) {
    this.prepareFile = this.prepareFile.bind(this);
    this.openZip = this.openZip.bind(this);
    this.extractLZMACompressedFile = this.extractLZMACompressedFile.bind(this);
    this.extractToDefault = this.extractToDefault.bind(this);
    this.zipPath = zipPath;
  }

  allFiles: MyFileType[] | null = null;

  async getAllFiles() {
    if (this.allFiles) return this.allFiles;
    const buffer = fs.readFileSync(this.zipPath);
    const directory = await unZipper.Open.buffer(buffer);
    const sum: MyFileType[] = [];
    await this.prepareFile(directory, sum, this.zipPath);
    this.allFiles = sum;
    return sum;
  }

  // async getFiles(file: MyFileType) {
  //   const files = this.allFiles || await this.getAllFiles();
  //   let filtered = files;
  //   if (file.dir) {
  //     filtered = files.filter(byDir(file.dir));
  //   }
  //
  //   if (file.name) {
  //     filtered = filtered.filter(byName(file.name));
  //   }
  //
  //   function byDir(pathRegex: RegExp) {
  //     return (file: MyFileType) => {
  //       return pathRegex.test(file.parentPath);
  //     };
  //   }
  //
  //   function byName(name: RegExp) {
  //     return (file: MyFileType) => {
  //       return name.test(file.path);
  //     };
  //   }
  //   return filtered;
  // }

  async extractLZMACompressedFile(buffer: Buffer, destPath: string) {
    return new Promise<void>(resolve => {
      lzma.decompress(buffer, {}, decompressedResult => {
        fs.writeFile(path.resolve(destPath), decompressedResult, () => {
          resolve();
        });
      });
    });
  }


  async prepareFile(directory: unZipper.CentralDirectory, sum: MyFileType[], zipPath: string) {
    const newFiles = directory.files.map(file => {
      let newFile = Object.assign(file, {
        parentPath: zipPath,
        isZip: isZip(file),
        isXZ: isXZ(file),
        extractToDefault: undefined as any,
      });
      return Object.assign(newFile, {
        extractToDefault : this.extractToDefault(newFile)
      })
    })
    sum.push(...newFiles);
    const zipFiles = newFiles.filter(isZip);

    return Promise.all(zipFiles.map(this.openZip(sum)));
  }

  extractToDefault(file: MyFileType) {
    return async () => {
      let folder = _.replace(path.resolve(`${file.parentPath}`), /\.zip/g, '_zip');
      await createDirIfNotExist(folder);
      const buffer = await file.buffer();
      if (file.isXZ) {
        await this.extractLZMACompressedFile(buffer, `${folder}/${file.path.replace('.xz', '')}`);
      } else {
        await new Promise<void>(async (resolve) => {
          const filePath = `${folder}/${file.path}`;
          if (file.type === 'Directory') {
            createDirIfNotExist(filePath)
              .then(resolve);
          } else {
            fs.writeFile(`${filePath}`, buffer, () => {
              console.log(`File is writtern ${filePath}`);
              resolve();
            });
          }
        });
      }
    };
  }

  openZip(sum: MyFileType[]) {
    return async (zip: MyFileType) => {
      const buffer = await zip.buffer();
      const directory = await unZipper.Open.buffer(buffer);
      await this.prepareFile(directory, sum, `${zip.parentPath}/${zip.path}`);
    };
  }
}

module.exports = {
  ZipExplorer
};

function isZip(file: File) {
  return !!file.path && (file.path.endsWith(ZIP_SUFFIX));
}

function isXZ(file: File) {
  return !!file.path && file.path.endsWith('.xz');
}

function createDirIfNotExist(toCreateDir: string) {
  if (fs.existsSync(toCreateDir)) return Promise.resolve();

  console.log(`Creating dir ${toCreateDir}`);
  return new Promise<void>((resolve) => {
    fs.mkdir(toCreateDir, { recursive: true }, () => {
      console.log(`Dir is created ${toCreateDir}`);
      resolve();
    });
  });
}

