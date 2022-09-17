# recursive-unzipper

Recursively unzip compressed file(`.zip`, `.xz`, `.tar`, and their nest combinations)

For instance, a zip file might contain a tar file, and in the tar file there could be a `.xz` file;
All of their content (and descendants if still compressed) will be extracted in single execution.

## Installation

```bash
#global Installation
npm i recursive-unzipper -g
```
    
## API Reference

```
$ recursive-unzipper -h
Usage: recursive-unzipper [global options]

Options:
  -V, --version                       output the version number
  -f --file [file]                    Path of the file to be extract
  -ds --dest [destination directory]  The destination directory where file will be extracted; if not specified, a same     
                                      name directory will be created aside of the zip file as the "destination directory"  
  -h, --help                          display help for command
```

Supported formats

`.zip` , `.xz`, `.tar`

## Running Tests

To run tests, run the following command

```bash
  npm run test
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

