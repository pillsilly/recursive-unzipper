import fs from 'fs';
import path from 'path';
import lzma from 'lzma-native';
import tar from 'tar';
import pino from 'pino';
const {rimraf} = require('rimraf');

export const logger = pino({
  name: 'recursive-unzipper',
  base: {},
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});
const extract = require('extract-zip');

const read = require('fs-readdir-recursive');

const SUFFIX = {
  XZ: '.xz',
  ZIP: '.zip',
  TAR: '.tar',
};

const EXTRACTED_DIR_SUFFIX = `.extracted`;

export class Extractor {
  private readonly basePath: string;
  private readonly outPutPath: string;
  private readonly fileName: string;

  constructor(private filePath: string, private dest?: string, private bail: boolean = false) {
    const chopped = filePath.split(path.sep);
    const tmpFileName = chopped.pop();
    if (!tmpFileName) throw Error(`Illegal filename ${filePath}`);
    this.fileName = tmpFileName;

    this.basePath = chopped.slice(0, chopped.length - 1).join(path.sep);
    if (dest) {
      this.outPutPath = path.resolve(dest);
    } else {
      this.outPutPath = path.resolve(`${filePath}${EXTRACTED_DIR_SUFFIX}`);
    }
  }

  public async extract() {
    createDirIfNotExist(this.outPutPath);
    if (isZip(this.filePath)) {
      await this.extractZip();
    } else if (isTar(this.filePath)) {
      this.extractTar();
    } else if (isXZ(this.filePath)) {
      await this.extractXz();
    }

    await this.loopFiles(this.outPutPath);
  }

  private extractTar() {
    logger.info(`Extracting tar [${this.filePath}]`);
    try {
      tar.x({
        file: this.filePath,
        strip: 1,
        sync: true,
        C: this.outPutPath, // alias for cwd:'some-dir', also ok
      });
    } catch (err: any) {
      logger.error(getFailedToExtractMessage(this.filePath), err);
      if (this.bail) throw new Error(getFailedToExtractMessage(this.filePath));
    }
  }

  private async extractXz() {
    logger.info(`Extracting xz [${this.filePath}]`);
    return new Promise<void>((resolve, reject) => {
      const binaryPath = this.outPutPath + '/' + unwrapXzExtension(this.fileName);
      const output = fs
        .createWriteStream(binaryPath)
        .on('close', resolve) // if transform stream and input stream don't go wrong, then it's always OK to resolve when ouput stream is closed.
        .on('error', (e) => {
          logger.error(`writing lzma data to disk gone wrong: ${e.stack}`);
          if (this.bail) {
            reject(new Error(getFailedToExtractMessage(this.filePath)));
          } else {
            resolve(); // if it's not bail, then resolve when the writer stream goes wrong: e.g disk is full.
          }
        });
      const input = fs.createReadStream(this.filePath);
      const transform = lzma.createDecompressor({threads: 1, synchronous: true}).on('error', (e) => {
        logger.error(`lzma Decompressor error ${e.stack}`);
        if (this.bail) {
          reject(new Error(getFailedToExtractMessage(this.filePath)));
        } // if it's not bail, then leave the resolve timing to the writer stream: line 87
      });
      input.pipe(transform).pipe(output);
    });

    function unwrapXzExtension(fileName: string) {
      return fileName.toLowerCase().replace('.xz', '').split('/').pop();
    }
  }

  private async extractZip() {
    logger.info(`Extracting zip [${this.filePath}]`);
    try {
      await extract(this.filePath, {dir: this.outPutPath});
    } catch (err) {
      logger.error(getFailedToExtractMessage(this.filePath), err);
      if (this.bail) throw new Error(getFailedToExtractMessage(this.filePath));
    }
  }

  private async loopFiles(outputPath: string) {
    const filePathArray: string[] = read(outputPath);

    for await (const file of filePathArray) {
      const absoluteFilePath = path.resolve(outputPath, file);

      if (isZip(file) || isTar(file) || isXZ(file)) {
        const newExtractor = new Extractor(absoluteFilePath, undefined, this.bail);
        await newExtractor.extract();
        rimraf.moveRemove.sync(absoluteFilePath);
      }
    }
  }
}

function createDirIfNotExist(toCreateDir: string) {
  toCreateDir = path.resolve(toCreateDir);

  if (!fs.existsSync(toCreateDir)) {
    fs.mkdirSync(toCreateDir, {recursive: true});
  }

  return toCreateDir;
}

function isTar(fileNameOrPath: string) {
  return isFileType(fileNameOrPath, SUFFIX.TAR);
}

function isZip(fileNameOrPath: string) {
  return isFileType(fileNameOrPath, SUFFIX.ZIP);
}

function isXZ(fileNameOrPath: string) {
  return isFileType(fileNameOrPath, SUFFIX.XZ);
}

function isFileType(fileNameOrPath: string, fileType: string) {
  return !!fileNameOrPath && fileNameOrPath.toLowerCase().endsWith(fileType);
}

function getFailedToExtractMessage(message: string) {
  return `Failed to extract:${message}`;
}
