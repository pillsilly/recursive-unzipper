import path from "path";
import {ZipExplorer} from '../src/ZipExplorer';
import {run} from "../src/run";
import fs from "fs";
const tree = require('tree-node-cli');

const treeOptions = {sizes: false};
describe('run.ts', () => {
  const zipFilePath = getPath('./test/resource/sample_normal_nest_structure.zip');
  const zipDestPath = getPath('./test/resource/sample_normal_nest_structure_zip');

  const zipXzFilePath = getPath('./test/resource/sample_zip_contains_xz.zip');
  const zipXzDestPath = getPath('./test/resource/sample_zip_contains_xz_zip');

  const extractDirs = [zipDestPath, zipXzDestPath];

  let explorer !: ZipExplorer;
  beforeEach(() => {
  });

  afterEach(() => {
    extractDirs.forEach(extractedDir => fs.rm(extractedDir, {recursive: true, force: true}, () => {}))

    // @ts-ignore
    explorer = null;
  })

  test('should recursively extract all zip files for .zip', async () => {
    const expectedResult = `sample_normal_nest_structure_zip
├── some-file-A.txt
└── some_dir
    └── some_file-B.txt`

    await run({file: zipFilePath})
    const string = tree(zipDestPath, treeOptions);
    expect(string).toEqual(expectedResult);
  });

  test('should recursively extract all zip and xz files for .zip', async () => {
    const expectedResult = `sample_zip_contains_xz_zip
└── sample_zip_contains_xz
    ├── some-file-A.txt
    ├── some_dir
    │   ├── some_file-B.txt
    │   └── text_in_xz.log
    └── text_in_xz.log`

    await run({file: zipXzFilePath})
    const string = tree(zipXzDestPath, treeOptions);
    expect(string).toEqual(expectedResult);
  });


  describe('#Browsing', function () {
    test('should filter by name regex', async () => {
      explorer = new ZipExplorer(getPath('test/resource/sample_normal_nest_structure.zip'));
      const name = /\.txt/;

      let filtered = await explorer.getFiles({name});

      const fileList = filtered.map((file: { parentPath: any; path: any; }) => file.path);

      expect(fileList).toEqual
      ([
        "some-file-A.txt",
        "some_dir/some_file-B.txt"
      ]);
    });

    test('should filter by dir regex', async () => {
      explorer = new ZipExplorer(getPath('test/resource/sample_normal_nest_structure.zip'));

      let filtered = await explorer.getFiles({dir: /some_/});

      const fileList = filtered.map((file: { parentPath: any; path: any; }) => file.path);

      expect(fileList).toEqual
      ([
        "some_dir/",
        "some_dir/some_file-B.txt"
      ]);
    });

    test('should filter by dir & name regex', async () => {
      explorer = new ZipExplorer(getPath('test/resource/sample_normal_nest_structure.zip'));

      let filtered = await explorer.getFiles({dir: /some_/, name: /\.txt/});

      const fileList = filtered.map((file: { parentPath: any; path: any; }) => file.path);

      expect(fileList).toEqual
      ([
        "some_dir/some_file-B.txt"
      ]);
    });
  });

});

function getPath(relativePath: string) {
  return path.resolve(relativePath)
}
