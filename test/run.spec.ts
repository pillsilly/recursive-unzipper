import { rimraf } from 'rimraf';
import { logger } from '../src/Extractor';
import { getPluginFunctions, run, RunParameters } from '../src/run';
import { getExtractedPath, getFilePath } from './test-util';

import tree from 'tree-node-cli';

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
        │   └── b-text_in_xz.log
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

const entryFileTestResults = {
  'sample_normal_nest_structure.tar': `sample_normal_nest_structure.tar.extracted
├── some-file.txt
└── some_dir
    └── some_file.txt`,
  'text_in_xz.log.xz': `text_in_xz.log.xz.extracted
└── text_in_xz.log`,
};

const bailTestFiles2 = {
  'sample_zip_contains_corrupt_xz.zip': `sample_zip_contains_corrupt_xz.zip.extracted
└── sample_zip_contains_corrupt_xz
    ├── a-text_in_xz.log.xz.extracted
    │   └── a-text_in_xz.log
    ├── some-file-A.txt
    └── some_dir
        ├── b-text_in_xz.log.xz.extracted
        │   └── b-text_in_xz.log
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

describe('#run.ts', function () {
  logger.level = 'debug';

  // write UT for getPluginFunctions with jest mock is too complex, so I just leave it here.
  it('should getPluginFunctions work', async function () {
    const pluginFunctions = await getPluginFunctions({
      zip: 'test/resource/testplugin.js',
      tar:  'test/resource/testplugin.js',
      xz:  'test/resource/testplugin.js'
    });
    expect(await pluginFunctions?.zip?.(5,6)).toEqual(123);
    expect(await pluginFunctions?.tar?.(5,6)).toEqual(123);
    expect(await pluginFunctions?.xz?.(5,6)).toEqual(123);
  });

  let testFileNames: string[] = [];
  afterEach(() => {
    for (const testFileName of testFileNames) {
      rimraf.rimrafSync(getExtractedPath(testFileName));
    }
    testFileNames = [];
  });

  Object.entries(testFileAndResult).forEach(([file, expectation]) => {
    it('should observe expected tree after extracted file ' + file, async function () {
      testFileNames.push(file);
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
        testFileNames.push(file);
        const filePath = getFilePath(file);
        const extractedPath = getExtractedPath(file);
        await run({file: filePath, dest: extractedPath});
        const fileTree = tree(extractedPath, treeOptions);
        expect(fileTree).toEqual(expectation);
      },
      30000
    );
  });

  Object.entries(bailTestFiles2).forEach(([file]) => {
    it(
      'should observe expected tree after extracted(bail==true) corrupted file ' + file,
      async function () {
        testFileNames.push(file);
        const filePath = getFilePath(file);
        const extractedPath = getExtractedPath(file);
        return expect(run({file: filePath, dest: extractedPath, bail: true})).rejects.toMatchObject({message: expect.stringMatching('Failed to extract:')});
      },
      10000
    );
  });

  Object.entries(entryFileTestResults).forEach(([file, expectation]) => {
    it(
      'should support extract from entry file' + file,
      async function () {
        testFileNames.push(file);
        const filePath = getFilePath(file);
        const extractedPath = getExtractedPath(file);
        await run({file: filePath, dest: extractedPath});
        const fileTree = tree(extractedPath, treeOptions);
        expect(fileTree).toEqual(expectation);
      },
      10000
    );
  });

  Object.entries({
    'text_in_xz.log-files.zip': `text_in_xz.log-files.zip.extracted
├── text_in_xz.log-1.xz.extracted
│   └── text_in_xz.log-1
├── text_in_xz.log-2.xz.extracted
│   └── text_in_xz.log-2
└── text_in_xz.log-3.xz.extracted
    └── text_in_xz.log-3`,
  }).forEach(([file, expectation]) => {
    it('should extract the last xz file (*.-3.xz) if bail set to false(default)', async function () {
      testFileNames.push(file);
      const filePath = getFilePath(file);
      const extractedPath = getExtractedPath(file);
      await run({file: filePath, dest: extractedPath});
      const fileTree = tree(extractedPath, treeOptions);
      expect(fileTree).toEqual(expectation);
    });
  });

  Object.entries({
    'text_in_xz.log-files.zip': `text_in_xz.log-files.zip.extracted
├── text_in_xz.log-1.xz.extracted
│   └── text_in_xz.log-1
├── text_in_xz.log-2.xz
├── text_in_xz.log-2.xz.extracted
│   └── text_in_xz.log-2
└── text_in_xz.log-3.xz`,
  }).forEach(([file, expectation]) => {
    it('should NOT extract the last xz file (*.-3.xz) if bail set to true', async function () {
      testFileNames.push(file);
      const filePath = getFilePath(file);
      const extractedPath = getExtractedPath(file);
      await expect(run({file: filePath, dest: extractedPath, bail: true})).rejects.toMatchObject({message: expect.stringMatching('Failed to extract:')});

      const fileTree = tree(extractedPath, treeOptions);
      expect(fileTree).toEqual(expectation);
    });
  });

  Object.entries({
    'sample_zip_contains_jar.zip': `sample_zip_contains_jar.zip.extracted
├── a-text_in_xz.log.xz.extracted
│   └── a-text_in_xz.log
├── some-file-A.jar.extracted
│   └── some-file-A.txt
└── some_dir
    ├── b-text_in_xz.log.xz.extracted
    │   └── b-text_in_xz.log
    └── some_file-B.txt`,
  }).forEach(([file, expectation]) => {
    it('should extract jar when jar is appointed as zip', async function () {
      testFileNames.push(file);
      const filePath = getFilePath(file);
      const extractedPath = getExtractedPath(file);
      await run({file: filePath, dest: extractedPath, map: 'jar|zip'});
      const fileTree = tree(extractedPath, treeOptions);
      expect(fileTree).toEqual(expectation);
    });
  });

  // test for extracting files with custom plugin

  it('should extract zip with customized zip decompressor funtion', async function () {
    // set up the run parameters
    const runParameters: RunParameters = {
      file: getFilePath('test/resource/testplugin.js.zip'),
      dest: getExtractedPath('test/resource/testplugin.js.zip.extracted'),
      plugin: {
        extract: {
          zip: 'test/example-zip.extractor.js', // path to the custom plugin
        },
      },
      bail: false,
    };

    await run(runParameters)
  });

  it('should extract tar with customized tar decompressor funtion', async function () {
    // set up the run parameters
    const myCustomDecompressorFunction = async (filePath: string) => {};
    const runParameters: RunParameters = {
      file: getFilePath('testplugin.js.tar'),
      dest: getExtractedPath('testplugin.js.tar.extracted'),
      plugin: {
        extract: {
          tar: 'test/example-tar.extractor.js', // path to the custom plugin
        },
      },
      bail: false,
    };

    await run(runParameters);
  });

  it('should extract xz with customized xz decompressor funtion', async function () {
    // set up the run parameters
    const runParameters: RunParameters = {
      file: getFilePath('testplugin.js.xz'),
      dest: getExtractedPath('testplugin.js.xz.extracted'),
      plugin: {
        extract: {
          xz: 'test/example-xz.extractor.js', // path to the custom plugin
        },
      },
      bail: false,
    };

    await run(runParameters);
  });

  // test: it should work when all extractors are customized for a file that is nested compressed by tar, zip, xz
  it('should extract nested compressed file with all customized extractors', async function () {
    const runParameters: RunParameters = {
      file: getFilePath('sample_normal_nest_structure.zip'),
      dest: getExtractedPath('sample_normal_nest_structure.zip'),
      plugin: {
        extract: {
          zip: 'test/example-zip.extractor.js',
          tar: 'test/example-tar.extractor.js',
          xz: 'test/example-xz.extractor.js',
        },
      },
      bail: false,
    };

    await run(runParameters);
    const fileTree = tree(getExtractedPath('sample_normal_nest_structure.zip'), treeOptions);
    expect(fileTree).toEqual(testFileAndResult['sample_normal_nest_structure.zip']);
  });

});

