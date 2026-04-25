import fs from 'fs';
import path from 'path';
import detectCompression from '../src/detectCompression';
import { detectCompression as publicDetectCompression, CompressionType } from '../src/index';

const resourceDir = path.resolve(__dirname, 'resource');

describe('detectCompression', () => {
  it('detects zip files without extension', () => {
    const src = path.join(resourceDir, 'sample_normal_nest_structure.zip');
    const tmp = path.join(resourceDir, 'tmp_sample_zip_noext');
    fs.copyFileSync(src, tmp);
    expect(detectCompression(tmp)).toBe('zip');
    fs.unlinkSync(tmp);
  });

  it('detects xz files without extension', () => {
    const src = path.join(resourceDir, 'text_in_xz.log.xz');
    const tmp = path.join(resourceDir, 'tmp_sample_xz_noext');
    fs.copyFileSync(src, tmp);
    expect(detectCompression(tmp)).toBe('xz');
    fs.unlinkSync(tmp);
  });

  it('returns unknown for plain text', () => {
    const src = path.join(resourceDir, 'testplugin.js');
    const tmp = path.join(resourceDir, 'tmp_sample_txt_noext');
    fs.copyFileSync(src, tmp);
    expect(detectCompression(tmp)).toBe('unknown');
    fs.unlinkSync(tmp);
  });

  it('is exported from the public API', () => {
    expect(publicDetectCompression).toBe(detectCompression);
    const type: CompressionType = 'zip';
    expect(type).toBe('zip');
  });

  it('detects rar files without extension', () => {
    const src = path.join(resourceDir, 'sample_rar_only.rar');
    const tmp = path.join(resourceDir, 'tmp_sample_rar_noext');
    fs.copyFileSync(src, tmp);
    expect(detectCompression(tmp)).toBe('rar');
    fs.unlinkSync(tmp);
  });

  it('detects old-format tar without ustar magic via checksum heuristic', () => {
    const src = path.join(resourceDir, 'sample_v7_tar.tar');
    const tmp = path.join(resourceDir, 'tmp_sample_v7tar_noext');
    fs.copyFileSync(src, tmp);
    expect(detectCompression(tmp)).toBe('tar');
    fs.unlinkSync(tmp);
  });

  it('does not misdetect plain text as tar', () => {
    const src = path.join(resourceDir, 'testplugin.js');
    const tmp = path.join(resourceDir, 'tmp_sample_txt_not_tar');
    fs.copyFileSync(src, tmp);
    expect(detectCompression(tmp)).toBe('unknown');
    fs.unlinkSync(tmp);
  });

  it('does not misdetect zip as tar via heuristic', () => {
    const src = path.join(resourceDir, 'sample_normal_nest_structure.zip');
    const tmp = path.join(resourceDir, 'tmp_sample_zip_not_tar');
    fs.copyFileSync(src, tmp);
    expect(detectCompression(tmp)).toBe('zip');
    fs.unlinkSync(tmp);
  });
});
