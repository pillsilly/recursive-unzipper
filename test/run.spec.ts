import path from 'path';
import {run} from '../src/run';
import fs from 'fs';
import {logger} from '../src/Extractor';

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

const bailTestResults = {
  'sample_zip_contains_corrupt_xz.zip': `sample_zip_contains_corrupt_xz.zip.extracted
└── sample_zip_contains_corrupt_xz
    ├── a-text_in_xz.log.xz.extracted
    │   └── a-text_in_xz.log
    ├── some-file-A.txt
    └── some_dir
        ├── b-text_in_xz.log.xz.extracted
        └── some_file-B.txt`,
  'sample_zip_contains_corrupt_tar.zip': `sample_zip_contains_corrupt_tar.zip.extracted
└── sample_zip_contains_corrupt_tar
    ├── corrupted.tar.extracted
    └── some_dir
        └── some_file-B.txt`,
  'sample_zip_contains_corrupt_zip.zip': `sample_zip_contains_corrupt_zip.zip.extracted
└── sample_zip_contains_corrupt_zip
    └── some_dir
        ├── corrupted.zip.extracted
        └── some_file-B.txt`,
};

const bailWiseTestResults = {
  'sample_zip_contains_corrupt_xz.zip': `sample_zip_contains_corrupt_xz.zip.extracted
└── sample_zip_contains_corrupt_xz
    ├── a-text_in_xz.log.xz.extracted
    │   └── a-text_in_xz.log
    ├── some-file-A.txt
    └── some_dir
        ├── b-text_in_xz.log.xz.extracted
        └── some_file-B.txt`,
  'sample_zip_contains_corrupt_tar.zip': `sample_zip_contains_corrupt_tar.zip.extracted
└── sample_zip_contains_corrupt_tar
    ├── corrupted.tar.extracted
    └── some_dir
        └── some_file-B.txt`,
  'sample_zip_contains_corrupt_zip.zip': `sample_zip_contains_corrupt_zip.zip.extracted
└── sample_zip_contains_corrupt_zip
    └── some_dir
        ├── corrupted.zip.extracted
        └── some_file-B.txt`,
};

describe('run.ts', function () {
  logger.level = 'debug';

  afterAll(() => {
    Object.entries(testFileAndResult).forEach(([file]) => fs.rm(getExtractedPath(file), {recursive: true, force: true}, () => {}));
    Object.entries(bailTestResults).forEach(([file]) => fs.rm(getExtractedPath(file), {recursive: true, force: true}, () => {}));
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

  Object.entries(bailTestResults).forEach(([file, expectation]) => {
    it(
      'should observe expected tree after extracted corrupted file ' + file,
      async function () {
        const filePath = getFilePath(file);
        const extractedPath = getExtractedPath(file);
        await run({file: filePath, dest: extractedPath});
        const fileTree = tree(extractedPath, treeOptions);
        expect(fileTree).toEqual(expectation);
      },
      10000
    );
  });

  Object.entries(bailWiseTestResults).forEach(([file, expectation]) => {
    it(
      'should observe expected tree after extracted(bail==true) corrupted file ' + file,
      async function () {
        const filePath = getFilePath(file);
        const extractedPath = getExtractedPath(file);
        return expect(run({file: filePath, dest: extractedPath, bail: true})).rejects.toMatchObject({message: expect.stringMatching('Failed to extract:')});
      },
      10000
    );
  });
});

function getExtractedPath(fileName: string) {
  return path.resolve(`./test/resource/tmp/${fileName}.extracted`);
}

function getFilePath(fileName: string) {
  return path.resolve(`./test/resource/${fileName}`);
}
