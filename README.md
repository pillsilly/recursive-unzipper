# recursive-unzipper

Recursively extract a compressed file which includes different formats (`zip`, `xz`, `tar`) .

e.g, a target `zip` file might have a `tar` file inside, then in the `tar` file there could be a `xz` file;

## Install
 
```bash
#global Installation
npm i recursive-unzipper -g
```
    
## API Reference

```
$ recursive-unzipper -h
Usage: recursive-unzipper [global options]

Arguments:
  file                                The first argument is treated as the Path of target file. (Legacy way is through the option "-f")

Options:
  -V, --version                       output the version number
  -f --file [file]                    Path of the file to be extract
  -ds --dest [destination directory]  The destination directory where file will be extracted; if not specified, a same name directory will be
                                      created aside of the zip file as the "destination directory"
  -bail --bail [bail]                 If true then it won't continue when error is captured (default: false)
  -m --map [map]                      If you are certain about specific type of files were compressed by any of the supported algorithm, e.g,
                                      jar can be extracted by zip algorithm; you can then acknowledge recursive-unzipper by passing this flag:
                                      e.g --map "jar|zip"
  -h, --help                          display help for command

```

## Supported formats

`zip` , `xz`, `tar`

--- 

## Run for development (run by ts-node)
`npm run run:dev`

## module support
- mjs
`import {run} from 'recursive-unzipper'`

- cjs
`const {run} = require('recursive-unzipper')`

## Build
` npm run build `

## Lint
`npm run lint`

## Run Tests

```bash
  npm run test
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

