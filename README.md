# recursive-unzipper

Recursively extract a compressed file which includes different formats (`zip`, `xz`, `tar`) .

e.g, a target `zip` file might have a `tar` file inside, then in the `tar` file there could be a `xz` file;

## Installation
 
```bash
#global Installation
npm i recursive-unzipper -g
```
    
## API Reference

```
$ recursive-unzipper -h
Usage: recursive-unzipper  [global options]

Options:
  -V, --version                       Print the version number

  -f --file [file]                    Path of the file to be extract

  -ds --dest [destination directory]  The destination directory where file will be extracted; if not specified, a same name directory will be created aside of the zip file in order to store the outputs.

  -bail --bail [bail]                 If true then it won't continue when error is captured (default: false)

  -m --map [map]                      If you are certain about specific file format is extractable by one of the supported formats, e.g, jar can be
                                      extracted just as zip with the same algorithm, you can acknowledge the SW by passing this flag: e.g --map "jar|zip"

  -h, --help                          display help for command
```

## Supported formats

`zip` , `xz`, `tar`

## Run Tests

```bash
  npm run test
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

