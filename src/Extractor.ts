import fs from 'fs';
import path from 'path';
import lzma from 'lzma-native';
import tar from 'tar';
import pino from 'pino';

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
    const buffer = fs.readFileSync(this.filePath);
    return new Promise<void>((resolve, reject) => {
      const binaryPath = this.outPutPath + '/' + unwrapXzExtension(this.fileName);
      lzma.decompress(buffer, {synchronous: true}, (decompressedResult) => {
        if (!decompressedResult) return this.handleExtractionError(resolve, reject, getFailedToExtractMessage(this.filePath));

        fs.writeFileSync(binaryPath, decompressedResult);
        resolve();
      });
    });

    function unwrapXzExtension(fileName: string) {
      return fileName.toLowerCase().replace('.xz', '').split('/').pop();
    }
  }

  handleExtractionError(resolve: (value: PromiseLike<void> | void) => void, reject: (reason?: any) => void, errorMsg: string) {
    logger.error(errorMsg);
    this.bail ? reject(new Error(errorMsg)) : resolve();
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
        await newExtractor.extract().finally(() => {
          fs.rmSync(absoluteFilePath, {force: true, retryDelay: 10000, maxRetries: 3});
        });
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
