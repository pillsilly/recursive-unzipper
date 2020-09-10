const {ZipExplorer} = require('../src/ZipExplorer')
const fs = require('fs');
const unZipper = require('unzipper');

describe('Name of the group', () => {
  const path = 'test/resource/run.zip'

  let explorer = new ZipExplorer(path);
  beforeEach(() => {

  });

  test('should extract lzma compressed file', async () => {
    const p = 'C:\\Users\\pills\\code\\InterractiveUnzipper\\test\\resource\\1.log.xz';
    const buffer = fs.readFileSync(p);
    await new ZipExplorer(path).extractLZMACompressedFile(buffer, '1.txt')
  });


  test('should extract tar compressed file', async () => {
    const p = 'C:\\Users\\pills\\code\\InterractiveUnzipper\\test\\resource\\BTS1_123D_linux_logs.tar';
    await unZipper.Open.file(p)
      .then(d => d.extract({path: './'}));
  });

  test('should traverse all zip directory', async () => {
    explorer = new ZipExplorer('test/resource/snapshot.zip')
    const files = await explorer.getAllFiles()
    await Promise.all(files.filter(f => !f.isZip)
      .map(f => f.extractToDefault())
    );
  });

  test('should work for snapshot files', async () => {
    explorer = new ZipExplorer('test/resource/snapshot.zip')
    const list = await explorer.listAll();

    const childrenZip = await list[0].getDirectory();
    console.log(list)
  });

  test('should list all entry path', async () => {
    const list = await explorer.listAll().then(l => l.map(({path}) => path));

    expect(list).toEqual([
      "123/",
      "123/run.js",
      "run.js",
    ]);
  });

  test('should list all entry path with given Regular expression', async () => {
    const list = await explorer.listAll(/.js/).then(l => l.map(({path}) => path));
    expect(list).toEqual([
      "123/run.js",
      "run.js",
    ]);
  });

  afterEach(() => {

  });
});
