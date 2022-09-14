import path from 'path';
import {run} from '../src/run';
import fs from 'fs';

const tree = require('tree-node-cli');

const treeOptions = {sizes: false};

const testFileAndResult = {
  'sample_normal_nest_structure.tar': `sample_normal_nest_structure.tar.extracted
├── some-file.txt
└── some_dir
    └── some_file.txt`,
  'sample_normal_nest_structure.tar.xz': `sample_normal_nest_structure.tar.xz.extracted
└── sample_normal_nest_structure.tar.extracted
    ├── some-file.txt
    └── some_dir
        └── some_file.txt`,
  'sample_normal_nest_structure.tar.zip': `sample_normal_nest_structure.tar.zip.extracted
├── sample_normal_nest_structure.tar.extracted
│   ├── some-file.txt
│   └── some_dir
│       └── some_file.txt
└── some-file-A.txt`,
  'sample_normal_nest_structure.zip': `sample_normal_nest_structure.zip.extracted
├── some-file-A.txt
└── some_dir
    └── some_file-B.txt`,
  'sample_zip_contains_xz.zip': `sample_zip_contains_xz.zip.extracted
└── sample_zip_contains_xz
    ├── a-text_in_xz.log.xz.extracted
    │   └── a-text_in_xz.log
    ├── some-file-A.txt
    └── some_dir
        ├── b-text_in_xz.log.xz.extracted
        │   └── b-text_in_xz.log
        └── some_file-B.txt`,
  'text_in_xz.log.xz': `text_in_xz.log.xz.extracted
└── text_in_xz.log`,
};

describe('run.ts', function () {
  afterAll(() => {
    Object.entries(testFileAndResult).forEach(([file]) => fs.rm(getExtractedPath(file), {recursive: true, force: true}, () => {}));
  });
  Object.entries(testFileAndResult).forEach(([file, expectation]) => {
    it('should observe expected tree after extracted file ' + file, async function () {
      const filePath = getFilePath(file);
      const extractedPath = getExtractedPath(file);
      await run({file: filePath, dest: extractedPath});
      const fileTree = tree(extractedPath, treeOptions);
      expect(fileTree).toEqual(expectation);
    });
  });
});

function getExtractedPath(fileName: string) {
  return path.resolve(`./test/resource/tmp/${fileName}.extracted`);
}

function getFilePath(fileName: string) {
  return path.resolve(`./test/resource/${fileName}`);
}
