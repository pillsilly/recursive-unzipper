import unZipper, {File} from 'unzipper';
import fs from 'fs';
import path from 'path';
import lzma from 'lzma-native';
import {replace} from "lodash";

const SUFFIX = {
  XZ: '.xz',
  ZIP: '.zip'
}
export type FileHandlerType = {
  dir?: RegExp,
  name?: RegExp,
  path: string
  parentPath: string
  isZip: boolean
  isXZ: boolean
  type: string
  extractToDefault: any
} & unZipper.File

export class ZipExplorer {

  constructor(private readonly zipPath: string, private dest: string = '') {
    this.prepareFile = this.prepareFile.bind(this);
    this.openZip = this.openZip.bind(this);
    this.extractLZMACompressedFile = this.extractLZMACompressedFile.bind(this);
    this.extractToDefault = this.extractToDefault.bind(this);
    this.zipPath = zipPath;

    if(dest && !fs.existsSync(dest)) {
      fs.mkdirSync(dest, {recursive:true});
    }
  }

  allFiles: FileHandlerType[] | null = null;

  async getAllFiles() {
    if (this.allFiles) return this.allFiles;
    const buffer = fs.readFileSync(this.zipPath);
    const directory = await unZipper.Open.buffer(buffer);
    const _allFiles: FileHandlerType[] = [];
    await this.prepareFile(directory, _allFiles, this.zipPath);
    this.allFiles = _allFiles;
    return _allFiles;
  }

  async getFiles(file: Pick<FileHandlerType, 'dir' | 'name'>) {
    const files = this.allFiles || await this.getAllFiles();
    let filtered = files;
    if (file.dir) {
      filtered = files.filter(byDir(file.dir));
    }

    if (file.name) {
      filtered = filtered.filter(byName(file.name));
    }

    function byDir(pathRegex: RegExp) {
      return (file: FileHandlerType) => {
        return pathRegex.test(file.path);
      };
    }

    function byName(name: RegExp) {
      return (file: FileHandlerType) => {
        return name.test(file.path);
      };
    }

    return filtered;
  }

  async extractLZMACompressedFile(buffer: Buffer, destPath: string) {
    return new Promise<void>(resolve => {
      console.log(`start decompress ${destPath}`)
      lzma.decompress(buffer, {synchronous: true}, decompressedResult => {
        fs.writeFileSync(path.resolve(destPath), decompressedResult);
        console.log(`decompress done ${destPath}`)
        resolve();
      });
    });
  }

  async prepareFile(directory: unZipper.CentralDirectory, sum: FileHandlerType[], zipPath: string) {
    const baseFolder = this.dest ? this.dest : zipPath;
    const newFiles = directory.files.map(file => {
      let newFile = Object.assign(file, {
        parentPath: baseFolder,
        isZip: isZip(file),
        isXZ: isXZ(file),
        extractToDefault: undefined as any,
      });
      return Object.assign(newFile, {
        extractToDefault: this.extractToDefault(newFile),
      });
    });
    sum.push(...newFiles);
    const zipFiles = newFiles.filter(isZip);

    return Promise.all(zipFiles.map(this.openZip(sum)));
  }

  extractToDefault(file: FileHandlerType) {
    return async () => {
      const folder = replace(path.resolve(`${file.parentPath}`), /\.zip/g, '_zip');
      await createDirIfNotExist(folder);
      const buffer = await file.buffer();
      if (file.isXZ) {
        await this.extractLZMACompressedFile(buffer, `${folder}/${file.path.replace(SUFFIX.XZ, '')}`);
      } else {
        await this.extractNonXzFile(folder, file, buffer);
      }
    };
  }

  private extractNonXzFile(folder: string, file: { dir?: RegExp; name?: RegExp; path: string; parentPath: string; isZip: boolean; isXZ: boolean; type: string; extractToDefault: any } & File, buffer: Buffer) {
    return new Promise<void>(async (resolve) => {
      const filePath = `${folder}/${file.path}`;
      if (file.type === 'Directory') {
        createDirIfNotExist(filePath)
          .then(resolve);
      } else {
        fs.writeFile(`${filePath}`, buffer, () => {
          console.log(`File is written ${filePath}`);
          resolve();
        });
      }
    });
  }

  openZip(sum: FileHandlerType[]) {
    return async (zip: FileHandlerType) => {
      const buffer = await zip.buffer();
      const directory = await unZipper.Open.buffer(buffer);
      await this.prepareFile(directory, sum, `${zip.parentPath}/${zip.path}`);
    };
  }
}

function isZip(file: File) {
  return !!file.path && (file.path.endsWith(SUFFIX.ZIP));
}

function isXZ(file: File) {
  return !!file.path && file.path.endsWith(SUFFIX.XZ);
}

function createDirIfNotExist(toCreateDir: string) {
  if (fs.existsSync(toCreateDir)) return Promise.resolve();

  console.log(`Creating dir ${toCreateDir}`);
  return new Promise<void>((resolve) => {
    fs.mkdir(toCreateDir, {recursive: true}, () => {
      console.log(`Dir is created ${toCreateDir}`);
      resolve();
    });
  });
}

