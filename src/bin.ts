#!/usr/bin/env node

import { program } from "commander";
import pkgJson from '../package.json';
import { run } from './run';

run(getOptions());

function getOptions() {
  program
    .name('recursive-unzipper')
    .version(pkgJson.version)
    .allowUnknownOption()
    .usage('[global options]')
    .requiredOption(
      '-f --file [file]',
      'Path of the files to be extract'
    )
    .option('-d --dir [dir]', 'A directory name to filter with')
    .option('-ds --dest [destination directory]', 'The destination directory where file will be extracted; if not specified, a same name directory will be created aside of the zip file as the "destination directory"')
    .option(
      '-n --name [name]', 'A file name to filter with'
    )
    .parse(process.argv);
  const opts = program.opts() as Parameters<typeof run>[0];
  console.info(opts);
  return opts;
}
