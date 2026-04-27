import fs from 'fs';
import path, { extname } from 'path';
import lzma from 'lzma-native';
import tar from 'tar';
import detectCompression from './detectCompression';

import * as defaultZipExtractor from 'extract-zip';

// Custom logger that mimics pino's interface for easy replacement later
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m'
};

export const logger = {
  info: (message: string) => {
    const time = new Date(Date.now()).toISOString();
    console.log(`${colors.gray}[${time}]${colors.reset} ${colors.green}INFO${colors.reset} (recursive-unzipper): ${message}`);
  },
  error: (message: string, err?: any) => {
    const time = new Date(Date.now()).toISOString();
    console.error(`${colors.gray}[${time}]${colors.reset} ${colors.red}ERROR${colors.reset} (recursive-unzipper): ${message}`);
    if (err) {
      console.error(`${colors.red}${err}${colors.reset}`);
    }
  },
  success: (message: string) => {
    console.log(`\n✅${colors.reset} ${colors.bold}${colors.green}${message}${colors.reset}\n`);
  },
  fail: (message: string) => {
    console.log(`\n❌ FAILURE ${colors.reset} ${colors.bold}${colors.red}${message}${colors.reset}\n`);
  },
  partial: (message: string) => {
    console.log(`\n⚠️ PARTIAL ${colors.reset} ${colors.bold}${colors.yellow}${message}${colors.reset}\n`);
  }
};

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
  [key in 'zip' | 'tar' | 'xz' | string]: string[];
};

type ExtractorType = () => Promise<any> | void;
export type PluginFunctionsType = {
  [key: string]: (filePath: string, options: any) => Promise<void>;
}
export class Extractor {
  private readonly outPutPath: string = '';
  private readonly fileName: string = '';

  private filePath: string;
  private dest?: string;
  private bail: boolean;
  private extMapping: extMappingType;
  private pluginFunctions: PluginFunctionsType;
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
    for (const key of Object.keys(pluginFunctions)) {
      this.extMapping[key as keyof extMappingType] = [`.${key}`];
    }

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

    if (dest) {
      this.outPutPath = path.resolve(dest);
    } else {
      this.outPutPath = path.resolve(`${filePath}${EXTRACTED_DIR_SUFFIX}`);
    }
  }

  public async extract() {
    createDirIfNotExist(this.outPutPath);
    let handled = false;
    for (const type of Object.keys(this.extMapping)) {
      for (const suffix of this.extMapping[type as keyof extMappingType]) {
        if (isFileType(this.filePath, suffix)) {
          // If a plugin is configured for this type, use it
          if (this.pluginFunctions && typeof this.pluginFunctions[type] === 'function') {
            await this.pluginFunctions[type](this.filePath, { dir: this.outPutPath });
            handled = true;
          } else {
            // Use built-in extractor
            if (type === 'zip') {
              await this.extractZip();
              handled = true;
            } else if (type === 'tar') {
              this.extractTar();
              handled = true;
            } else if (type === 'xz') {
              await this.extractXz();
              handled = true;
            }
          }
          break;
        }
      }
      if (handled) break;
    }
    if (!handled) {
      // Try magic-byte detection for files without extensions or unknown suffixes
      const detected = detectCompression(this.filePath);
      if (detected !== 'unknown') {
        if (this.pluginFunctions && typeof this.pluginFunctions[detected] === 'function') {
          await this.pluginFunctions[detected](this.filePath, { dir: this.outPutPath });
          handled = true;
        } else if (detected === 'zip') {
          await this.extractZip();
          handled = true;
        } else if (detected === 'xz') {
          await this.extractXz();
          handled = true;
        } else if (detected === 'tar') {
          this.extractTar();
          handled = true;
        }
      }

      if (!handled) {
        logger.error(`No extractor found or no files decompressed for: ${this.filePath}`);
        throw new Error(`Failed to extract:${this.filePath} (no files decompressed)`);
      }
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
      if (fileName.toLowerCase().endsWith('.xz')) {
        return fileName.toLowerCase().replace(/\.xz$/, '').split('/').pop();
      }
      // No .xz extension: append .decompressed to distinguish from the compressed source
      return (fileName.split('/').pop() || fileName) + '.decompressed';
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
    const entries = await fs.promises.readdir(outputPath, { recursive: true, withFileTypes: true });
    const filePathArray = entries.filter(e => e.isFile()).map(e => path.join(e.parentPath, e.name));
    for (const file of filePathArray) {
      if (this.shouldExtract(file)) {
        const newExtractor = new Extractor({
          filePath: file,
          bail: this.bail,
          extMapping: this.extMapping,
          pluginFunctions: this.pluginFunctions,
        });
        await newExtractor.extract();
        fs.rmSync(file, { recursive: true, force: true });
      }
    }
  }

  private shouldExtract(file: string): boolean {
    if (this.matchesAnyExtMapping(file)) return true;
    const detected = detectCompression(file);
    return detected !== 'unknown';
  }

  private matchesAnyExtMapping(file: string): boolean {
    for (const type of Object.keys(this.extMapping)) {
      for (const suffix of this.extMapping[type as keyof extMappingType]) {
        if (isFileType(file, suffix)) return true;
      }
    }
    return false;
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
