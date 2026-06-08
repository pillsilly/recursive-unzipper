# recursive-unzipper

Recursively extract nested archives of any format — ZIP inside TAR inside XZ, and beyond.
[![DeepWiki](https://img.shields.io/badge/Wiki-DeepWiki-blue)](https://deepwiki.com/pillsilly/recursive-unzipper) 
![npm version](https://img.shields.io/npm/v/recursive-unzipper) ![npm downloads](https://img.shields.io/npm/dm/recursive-unzipper)

## Features

- **Recursive extraction** — automatically finds and extracts archives within archives
- **Multi-format** — built-in support for ZIP, TAR, and XZ; extensible via plugins
- **Magic-byte detection** — extracts files even without extensions by reading file signatures
- **Dual CLI + library** — use as a command-line tool or import in your Node.js project
- **Plugin system** — add support for any format (RAR, 7z, custom) with a simple function
- **Graceful error handling** — continue on per-file errors or bail at the first failure

## Installation

```bash
# Globally (CLI usage)
npm install recursive-unzipper -g

# Or locally (library usage)
npm install recursive-unzipper
```

## CLI Usage

Extract any archive with automatic format detection and recursive unpacking:

```bash
# Basic extraction
recursive-unzipper archive.zip

# Extract to a specific directory
recursive-unzipper archive.zip -d ./output

# Detect compression type without extracting
recursive-unzipper --detect unknown.file

# Custom extension mapping (treat .jar as .zip)
recursive-unzipper app.jar --map jar:zip

# Bail on first error instead of continuing
recursive-unzipper archive.zip --bail

# Use a custom extraction plugin
recursive-unzipper archive.rar --plugin rar:./rar-extractor.js
```

> [!TIP]
> The target file can be passed as a positional argument or via the `-f` / `--file` option.

### Options

| Option | Description |
|--------|-------------|
| `-V, --version` | Show version number |
| `-f, --file <path>` | Path to the archive file |
| `-d, --dest <path>` | Output directory (defaults to `./<filename>.extracted`) |
| `-b, --bail` | Stop on first extraction error |
| `-m, --map <mapping>` | Extension-to-format mapping, e.g. `--map "jar:zip"` |
| `--plugin <type:path>` | Custom plugin, e.g. `--plugin zip:./plugin.js` |
| `--detect` | Detect compression type and exit |
| `-h, --help` | Display help |

## Programmatic API

```ts
import { run, detectCompression } from 'recursive-unzipper';
```

### `run(options)`

```ts
await run({
  file: './archive.zip',
  dest: './output',
  bail: false,
  map: 'jar:zip',
  plugin: [{
    type: 'rar',
    pluginFunction: async (filePath, { dir }) => { /* ... */ }
  }]
});
```

### `detectCompression(filePath)`

Returns the detected compression type:

```ts
const type = detectCompression('./unknown.file');
// => 'zip' | 'xz' | 'tar' | 'rar' | 'unknown'
```

### Types

```ts
type CompressionType = 'zip' | 'xz' | 'tar' | 'rar' | 'unknown';
```

> [!NOTE]
> Both ESM (`import`) and CJS (`require`) are supported.

## Supported Formats

| Format | Built-in | Notes |
|--------|----------|-------|
| ZIP | Yes | Uses `extract-zip` |
| TAR | Yes | Uses `tar`, supports ustar and V7 formats |
| XZ | Yes | Uses `lzma-native` |
| RAR | Plugin | See example plugins in the test suite |
| Any | Plugin | Bring your own extractor |

## Magic-Byte Detection

When a file has no extension or an unrecognized extension, the compression type is detected automatically by reading the file signature:

| Format | Magic Bytes | Offset |
|--------|-------------|--------|
| ZIP | `PK\x03\x04` | 0 |
| XZ | `\xFD7zXZ\x00` | 0 |
| RAR | `Rar!\x1a\x07` | 0 |
| TAR (ustar) | `ustar` | 257 |
| TAR (V7) | checksum validation | 0–512 |

Detection works both at the top level and recursively — a ZIP containing an extensionless XZ file will still extract correctly.

```bash
recursive-unzipper myfile           # detected automatically
recursive-unzipper --detect myfile  # just report the type
```

## Custom Plugins

Plugins let you add extraction support for any format. Create a module that exports a single async function:

```js
// my-extractor.js
module.exports = async function(filePath, { dir }) {
  // Extract `filePath` into directory `dir`
};
```

Then use it with `--plugin`:

```bash
recursive-unzipper archive.rar --plugin rar:./my-extractor.js
```

Multiple plugins can be specified:

```bash
recursive-unzipper archive.rar --plugin rar:./rar.js --plugin 7z:./7z.js
```

> [!NOTE]
> See the [test suite](./test/) for complete plugin examples, including RAR extraction via CLI (`unrar`) and pure JavaScript (`node-unrar-js`).

## Error Handling

- **Default mode** (`--bail` not set): extraction continues on per-file errors. Partial results are preserved.
- **Bail mode** (`--bail`): extraction stops at the first error and rejects with a descriptive message.
- If no files are extracted at all, the operation fails with an error.

## Development

```bash
# Run locally (using tsx)
npm run run:dev

# Build
npm run compile:prod

# Lint
npm run lint

# Test
npm run test
```

The project uses TypeScript with `tsup` for building, Jest for testing, and `release-it` for releases.
