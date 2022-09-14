import fs from 'fs';
import path from 'path';
import lzma from 'lzma-native';
import unZipper from 'unzipper';
import {Readable} from 'stream';
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

  constructor(private filePath: string, private dest?: string) {
    const chopped = filePath.split(path.sep);
    this.fileName = chopped.pop() as string;
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
      await this.extractTar();
    } else if (isXZ(this.filePath)) {
      await this.extractXz();
    }

    await this.loopFiles(this.outPutPath);
  }

  private async extractTar() {
    logger.info(`Extracting tar [${this.filePath}]`);
    const buffer = fs.readFileSync(this.filePath);

    await new Promise((resolve) => {
      const readable = new Readable();
      readable._read = () => {}; // _read is required but you can noop it
      readable.push(buffer);
      readable.push(null);
      readable
        .pipe(
          tar.x({
            strip: 1,
            C: this.outPutPath, // alias for cwd:'some-dir', also ok
          })
        )
        .on('finish', resolve);
    });
  }

  private async extractXz() {
    logger.info(`Extracting xz [${this.filePath}]`);
    const buffer = fs.readFileSync(this.filePath);

    return new Promise<void>((resolve) => {
      const binaryPath =
        this.outPutPath + '/' + unwrapXzExtension(this.fileName);
      lzma.decompress(buffer, {synchronous: true}, (decompressedResult) => {
        fs.writeFileSync(binaryPath, decompressedResult);
        resolve();
      });
    });

    function unwrapXzExtension(fileName: string) {
      return fileName.toLowerCase().replace('.xz', '');
    }
  }

  private async extractZip() {
    logger.info(`Extracting zip [${this.filePath}]`);
    await new Promise((resolve) => {
      fs.createReadStream(this.filePath)
        .pipe(unZipper.Extract({path: this.outPutPath}))
        .on('close', resolve);
    });
  }

  private async loopFiles(outputPath: string) {
    const filePathArray: string[] = read(outputPath);

    for await (const file of filePathArray) {
      const absoluteFilePath = path.resolve(outputPath, file);

      if (isZip(file) || isTar(file) || isXZ(file)) {
        const newExtractor = new Extractor(absoluteFilePath);
        await newExtractor.extract();
        fs.rmSync(absoluteFilePath);
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
