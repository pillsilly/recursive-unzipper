import fs from 'fs';
import path, { extname } from 'path';
import lzma from 'lzma-native';
import tar from 'tar';
import pino from 'pino';

import {rimraf} from 'rimraf';
import * as defaultZipExtractor from 'extract-zip';

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

const SUFFIX = {
  XZ: '.xz',
  ZIP: '.zip',
  TAR: '.tar',
};

const defaultExtMapping: extMappingType = {
  zip: [SUFFIX.ZIP],
  tar: [SUFFIX.TAR],
  xz: [SUFFIX.XZ],
};

const EXTRACTED_DIR_SUFFIX = `.extracted`;
type extMappingType = {
  [key in 'zip' | 'tar' | 'xz']: string[];
};

type pluginType = {
  extract: {
    zip: string,
    tar: string,
    xz: string
  }
}

type ExtractorType = () => Promise<any> | void;
export type PluginFunctionsType = {
  zip?: ExtractorType,
  tar?: ExtractorType,
  xz?: ExtractorType,
}
export class Extractor {
  private readonly outPutPath: string = '';
  private readonly fileName: string = '';

  private filePath: string;
  private dest?: string;
  private bail: boolean;
  private extMapping: extMappingType;
  private pluginFunctions: PluginFunctionsType;
  private basePath: string = '';
  private zipExtractor: ExtractorType;
  private xzExtractor: ExtractorType;
  private tarExtractor: ExtractorType;

  constructor({
    filePath,
    dest,
    bail,
    extMapping,
    pluginFunctions = {},
  }: {
    filePath: string;
    dest?: string;
    bail: boolean;
    extMapping: extMappingType;
    pluginFunctions: PluginFunctionsType | undefined;
  }) {

    this.filePath = filePath;
    this.dest = dest;
    this.bail = bail;
    this.extMapping = extMapping;
    this.pluginFunctions = pluginFunctions;

    this.zipExtractor = () => {
       return (pluginFunctions?.zip || defaultZipExtractor.default).bind(this)(this.filePath, {dir: this.outPutPath});
    }

    this.xzExtractor = () => {
      // @ts-ignore
      return (pluginFunctions?.xz || this.defaultXzExtractor).bind(this)(this.filePath, {dir: this.outPutPath})
    }

    this.tarExtractor = () => {
      // @ts-ignore
      return (pluginFunctions?.tar || this.defaultTarExtractor).bind(this)(this.filePath, {dir: this.outPutPath})
    }

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
    if (this.isZip(this.filePath)) {
      await this.extractZip();
    } else if (this.isTar(this.filePath)) {
      this.extractTar();
    } else if (this.isXZ(this.filePath)) {
      await this.extractXz();
    }

    await this.loopFiles(this.outPutPath);
  }

  defaultTarExtractor (){
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

  private extractTar() {
    logger.info(`Extracting tar [${this.filePath}]`);
    return this.tarExtractor();
  }


  defaultXzExtractor() {
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


  private async extractXz() {
    logger.info(`Extracting xz [${this.filePath}]`);
    return this.xzExtractor();
  }


  private async extractZip() {
    logger.info(`Extracting zip [${this.filePath}]`);
    try {
      await this.zipExtractor();
    } catch (err) {
      logger.error(getFailedToExtractMessage(this.filePath), err);
      if (this.bail) throw new Error(getFailedToExtractMessage(this.filePath));
    }
  }

  private async loopFiles(outputPath: string) {
    const recursive = require('recursive-readdir');
    const filePathArray: string[] = await recursive(outputPath);
    for await (const file of filePathArray) {
      if (this.isZip(file) || this.isTar(file) || this.isXZ(file)) {
        const newExtractor = new Extractor({
          filePath: file,
          bail: this.bail,
          extMapping: this.extMapping,
          pluginFunctions: this.pluginFunctions,
        });
        await newExtractor.extract();
        rimraf.rimrafSync(file);
      }
    }
  }

  private isTar(fileNameOrPath: string) {
    return this.extMapping.tar.some((suffix) => isFileType(fileNameOrPath, suffix));
  }

  private isZip(fileNameOrPath: string) {
    
    return this.extMapping.zip.some((suffix) => isFileType(fileNameOrPath, suffix));
  }

  private isXZ(fileNameOrPath: string) {
    return this.extMapping.xz.some((suffix) => isFileType(fileNameOrPath, suffix));
  }

  public static appendExtMapping(map: string | undefined) {
    if (!map) return defaultExtMapping;

    const items = map.split(',');

    const extMapping = {...defaultExtMapping};
    for (const item of items) {
      const [extToMap, fileType] = item.split('|') as [string, keyof extMappingType];
      if (!fileType || !Object.values(SUFFIX).includes(`.${fileType}`)) {
        throw new Error(`Illegal mapping expression: ${item} `);
      }

      const extension = extToMap ? `.${extToMap}` : '';
      extMapping[fileType].push(extension);
    }

    return extMapping;
  }
}

function createDirIfNotExist(toCreateDir: string) {
  toCreateDir = path.resolve(toCreateDir);

  if (!fs.existsSync(toCreateDir)) {
    fs.mkdirSync(toCreateDir, {recursive: true});
  }

  return toCreateDir;
}

function isFileType(fileNameOrPath: string, fileType: string) {
  // no extention name, and the matcher is empty extention name
  if (!fileType && extname(fileNameOrPath).includes('.')) return false;
  return !!fileNameOrPath && fileNameOrPath.toLowerCase().endsWith(fileType);
}

function getFailedToExtractMessage(message: string) {
  return `Failed to extract:${message}`;
}
