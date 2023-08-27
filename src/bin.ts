#!/usr/bin/env node

import {CommanderError, InvalidArgumentError, InvalidOptionArgumentError, program} from 'commander';
import pkgJson from '../package.json';
import {run} from './run';
import path from 'path';
import fs from 'fs';

(async() => {
  const runArgs = getOptions();
  await run(runArgs);
})();

function getOptions() {
  program
    .name('recursive-unzipper')
    .version(pkgJson.version)
    .allowUnknownOption()
    .usage('[global options]')
    .argument('[file]', 'The first argument is treated as the Path of target file. (Legacy way is through the option "-f")', validatePath(InvalidArgumentError))
    .option('-f --file [file]', 'Path of the file to be extract', validatePath())
    .option(
      '-ds --dest [destination directory]',
      'The destination directory where file will be extracted; if not specified, a same name directory will be created aside of the zip file as the "destination directory"'
    )
    .option('-bail --bail [bail]', "If true then it won't continue when error is captured", false)
    .option(
      '-m --map [map]',
      'If you are certain about specific file format is extractable by one of the supported types, e.g, jar can be extracted just as zip with the same algorithm' +
        'you can acknowledge the SW by passing this flag: e.g --map "jar|zip" means to treat .jar files as .zip files, ' +
        'and it will then treat the format on the left as the one on the right ',
      undefined
    )
    .parse(process.argv)
    // .help({error:true});
  const opts = program.opts() as Parameters<typeof run>[0];
  const [file ] = program.processedArgs;
  const {file: fileInOpts} = opts;
  
  if (!!file === !!fileInOpts) {
    throw new CommanderError(1, '', 'File must be appointed in either command arg or option');
  }
  
  console.log(`Args: ${program.processedArgs}`)
  console.log(`Opts: ${JSON.stringify(opts)}`);
  opts.file = opts.file || file;
  return opts;
}

process.on('uncaughtException', function (err) {
  console.error(new Date().toUTCString() + ' uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
});

function validatePath(ErrorType = InvalidOptionArgumentError) {
  return (file: string) => {
    const filePath = path.resolve(file);
    if(!fs.existsSync(filePath)) {
      throw new InvalidOptionArgumentError(`Can't find file ${filePath}`);
    }
    return filePath;
  }
}

