# recursive-unzipper

Unzip things recursively

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
  -f --file [file]                    Path of the files to be extract
  -ds --dest [destination directory]  The destination directory where file will be extracted; if not specified, a same     
                                      name directory will be created aside of the zip file as the "destination directory"  
  -h, --help                          display help for command
```

About supported formats
- `--file `  Currenlty accpets .zip format
- The zip file could include both `.zip` and `.xz`

## Running Tests

To run tests, run the following command

```bash
  npm run test
```


## License

[MIT](https://choosealicense.com/licenses/mit/)

