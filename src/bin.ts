#!/usr/bin/env node

import { program } from "commander";
const pkgJson = require('../package.json');
import { run } from './run';
const param = getOptions();
run(param);

function getOptions() {
  program
    .name('instant_http ')
    .version(pkgJson.version)
    .allowUnknownOption()
    .usage('[global options]')
    .requiredOption(
      '-f --file [file]',
      'file'
    )
    .option('-d --dir [dir]', 'Dir to serve', process.cwd())
    .option(
      '-n --name [name]',
      'file name in the zip'
    )
    .parse(process.argv);
  const opts = program.opts() as Parameters<typeof run>[0];
  console.info(opts);
  return opts;
}