import { rimraf } from 'rimraf';
import { run } from '../src/run';
import { getExtractedPath, getFilePath } from './test-util';
import tree from 'tree-node-cli';
import fs from 'fs';
import path from 'path';

const treeOptions = { sizes: false };

describe('e2e: detectCompression integration', () => {
  const tmpFiles: string[] = [];
  afterEach(() => {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f); } catch(e) {}
    }
    for (const name of ['tmp_sample_zip_noext', 'tmp_sample_xz_noext', 'tmp_sample_tar_noext', 'tmp_sample_zip_contains_extensionless_xz']) {
      rimraf.rimrafSync(getExtractedPath(name));
    }
  });

  it('extracts zip files even when extension removed', async () => {
    const src = getFilePath('sample_normal_nest_structure.zip');
    const tmp = path.join(path.dirname(src), 'tmp_sample_zip_noext');
    fs.copyFileSync(src, tmp);
    tmpFiles.push(tmp);

    const dest = getExtractedPath('tmp_sample_zip_noext');
    await run({ file: tmp, dest });

  const fileTree = tree(dest, treeOptions);
  // extractor creates an extracted dir named after the input file (tmp_sample_zip_noext)
  // assert known files from the archive are present
  expect(fileTree).toContain('some-file-A.txt');
  });

  it('extracts xz files even when extension removed', async () => {
    const src = getFilePath('text_in_xz.log.xz');
    const tmp = path.join(path.dirname(src), 'tmp_sample_xz_noext');
    fs.copyFileSync(src, tmp);
    tmpFiles.push(tmp);

    const dest = getExtractedPath('tmp_sample_xz_noext');
    await run({ file: tmp, dest });

  const fileTree = tree(dest, treeOptions);
  // xz extractor will write a single file with .decompressed suffix when no .xz extension
  const innerName = path.basename(tmp) + '.decompressed';
  expect(fileTree).toContain(innerName);
  });

  it('recursively extracts ZIP containing extensionless XZ inner file', async () => {
    const src = getFilePath('sample_zip_contains_extensionless_xz.zip');
    const dest = getExtractedPath('tmp_sample_zip_contains_extensionless_xz');
    rimraf.rimrafSync(dest);

    await run({ file: src, dest });

    const fileTree = tree(dest, treeOptions);
    // The extensionless inner XZ file should be detected and decompressed
    expect(fileTree).toContain('inner_xz_noext.decompressed');
  });

  it('extracts tar files even when extension removed', async () => {
    const src = getFilePath('sample_normal_nest_structure.tar');
    const tmp = path.join(path.dirname(src), 'tmp_sample_tar_noext');
    fs.copyFileSync(src, tmp);
    tmpFiles.push(tmp);

    const dest = getExtractedPath('tmp_sample_tar_noext');
    await run({ file: tmp, dest });

  const fileTree = tree(dest, treeOptions);
  // assert known file inside tar is present
  expect(fileTree).toContain('some-file.txt');
  });
});
