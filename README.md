# recursive-unzipper

Recursively extract compressed files that include different formats (`zip`, `xz`, `tar`, `rar`, actually any format).

Supports nested formats: e.g., a target `zip` file might contain a `tar` file, which in turn could contain an `xz` or `rar` file.

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
  -V, --version                      Output the version number
  -f --file [file]                   Path of the file to be extract
  -d --dest [destination directory]  The destination directory where file will be extracted; if not specified, a same name directory will be created aside of the zip
                                     file as the "destination directory"
  -b --bail                          If true then it won't continue when error is captured (default: false)
  -m --map [map]                     If you are certain about specific type of files were compressed by any of the supported algorithm, e.g, jar can be extracted by zip
                                     algorithm; you can then acknowledge recursive-unzipper by passing this flag: e.g --map "jar|zip"
  --plugin <type:path>               Custom plugin for extraction, e.g. --plugin zip:./plugin.js (default: [])
  --detect                           Detect compression type without extracting
  -h, --help                         Display help for the command
```

## Supported Formats

`zip`, `xz`, `tar` (built-in)

`rar` (not built-in, but supported via custom plugin; see example plugins in the repo's test suite)

### Magic-Byte Detection

When a file has no extension or an unrecognized extension, recursive-unzipper automatically detects the compression type by reading the file's magic bytes (file signature). Supported detection:

| Format | Signature | Offset |
|--------|-----------|--------|
| ZIP    | `PK\x03\x04` | 0 |
| XZ     | `\xFD7zXZ\x00` | 0 |
| RAR    | `Rar!\x1a\x07` | 0 |
| TAR    | `ustar` | 257 |
| TAR (V7) | checksum validation | 0–512 |

This means you can extract files even without proper extensions:

```bash
recursive-unzipper myfile           # detected as zip/xz/tar/rar automatically
recursive-unzipper --detect myfile  # just report the type, don't extract
```

Magic-byte detection also works for inner files during recursive extraction — if a ZIP contains an extensionless XZ file, it will still be detected and decompressed.

### Custom Extraction Plugins

You can provide your own extraction logic for any format using the `--plugin` option.

Zip, jar, and xz are built-in, but you can override them with a plugin for special requirements.

```bash
recursive-unzipper myfile.rar --plugin rar:./my-rar-extractor.js
```

A plugin should export a function:
```js
module.exports = async function(filePath, options) {
  // Extract filePath to options.dir
};
```

### RAR Extraction
- RAR extraction is not built-in, but you can use the example plugins from the test suite in this repo, or write your own (CLI or pure JS).
- See [`test/example-rar.extractor.js`](./test/example-rar.extractor.js) for a CLI-based RAR plugin example, and [`test/example-rar-js.extractor.js`](./test/example-rar-js.extractor.js) for a pure JS RAR plugin example.
- For RAR4 archives, use the pure JS plugin. For RAR5 or compressed RAR4, use the CLI plugin.

### Error Handling
- If no files are decompressed, extraction fails and logs an error.
- If `--bail` is set, extraction stops on the first error.

## For development (using tsx)
`npm run run:dev`

## Module Support
- mjs: `import {run, detectCompression} from 'recursive-unzipper'`
- cjs: `const {run, detectCompression} = require('recursive-unzipper')`

`detectCompression(filePath)` returns `'zip' | 'xz' | 'tar' | 'rar' | 'unknown'`.

## Build
`npm run compile:prod`

## Lint
`npm run lint`

## Run Tests

```bash
npm run test
```

## Test coverage
- All archive formats and plugin scenarios are covered by the test suite.
- Tests verify both extraction success and file content/structure.

## License

[MIT](https://choosealicense.com/licenses/mit/)

