#!/usr/bin/env node

import {program} from 'commander';
import pkgJson from '../package.json';
import {run} from './run';

run(getOptions());

function getOptions() {
  program
    .name('recursive-unzipper')
    .version(pkgJson.version)
    .allowUnknownOption()
    .usage('[global options]')
    .requiredOption('-f --file [file]', 'Path of the file to be extract')
    // .option('-d --dir [dir]', 'A directory name to filter with')
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
    .parse(process.argv);
  const opts = program.opts() as Parameters<typeof run>[0];
  console.info(opts);
  return opts;
}

process.on('uncaughtException', function (err) {
  console.error(new Date().toUTCString() + ' uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
});
