# recursive-unzipper

Recursively extract compressed files that include different formats (`zip`, `xz`, `tar`).

e.g., a target `zip` file might contain a `tar` file, which in turn could contain an `xz` file.

## Installation

```bash
# Global installation
npm i recursive-unzipper -g
```
    
## API Reference

```
$ recursive-unzipper -h
Usage: recursive-unzipper [global options]

Arguments:
  file                                The first argument is treated as the path of the target file. (Legacy way is through the option "-f")

Options:
  -V, --version                       Output the version number
  -f --file [file]                    Path of the file to be extracted
  -ds --dest [destination directory]  The destination directory where the file will be extracted; if not specified, a directory with the same name will be
                                      created beside the zip file as the "destination directory"
  -bail --bail [bail]                 If true, the process will stop when an error is encountered (default: false)
  -m --map [map]                      If you know that specific types of files were compressed using any of the supported algorithms, e.g.,
                                      jar files can be extracted using the zip algorithm, you can inform recursive-unzipper by passing this flag:
                                      e.g., --map "jar|zip", which means to treat .jar files as .zip files
  -h, --help                          Display help for the command
```

## Supported Formats

`zip`, `xz`, `tar`

---

## Run for Development (using ts-node)
`npm run run:dev`

## Module Support
- mjs
`import {run} from 'recursive-unzipper'`

- cjs
`const {run} = require('recursive-unzipper')`

## Build
`npm run build`

## Lint
`npm run lint`

## Run Tests

```bash
npm run test
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

