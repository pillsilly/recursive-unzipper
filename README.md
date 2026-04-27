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
  -V, --version                       Output the version number
  -f --file [file]                    Path of the file to be extracted
  -ds --dest [destination directory]  The destination directory where the file will be extracted; if not specified, a directory with the same name will be
                                      created beside the zip file as the "destination directory"
  -bail --bail [bail]                 If true, the process will stop when an error is encountered (default: false)
  -m --map [map]                      If you know that specific types of files were compressed using any of the supported algorithms, e.g.,
                                      jar files can be extracted using the zip algorithm, you can inform recursive-unzipper by passing this flag:
                                      e.g., --map "jar|zip", which means to treat .jar files as .zip files
  --plugin <type:path>                Use a custom extraction plugin for a given type (zip, tar, xz, rar, etc). Example: --plugin zip:./my-zip.js --plugin rar:./my-rar.js
  --detect                            Detect compression type (zip, xz, tar, rar, unknown) without extracting; exits 0 for known types, 1 for unknown
  -h, --help                          Display help for the command
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

## For development (using ts-node)
`npm run run:dev`

## Module Support
- mjs: `import {run, detectCompression} from 'recursive-unzipper'`
- cjs: `const {run, detectCompression} = require('recursive-unzipper')`

`detectCompression(filePath)` returns `'zip' | 'xz' | 'tar' | 'rar' | 'unknown'`.

## Build
`npm run build`

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

