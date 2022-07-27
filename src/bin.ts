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
      'Path of the file to be extract'
    )
    .option('-d --dir [dir]', 'The dir name to filter with')
    .option(
      '-n --name [name]',
      'The file name to filter with'
    )
    .parse(process.argv);
  const opts = program.opts() as Parameters<typeof run>[0];
  console.info(opts);
  return opts;
}
