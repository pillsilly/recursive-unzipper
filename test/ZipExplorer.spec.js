const {ZipExplorer} = require('../src/ZipExplorer');
const fs = require('fs');
const unZipper = require('unzipper');

describe('Name of the group', () => {
  const path = 'test/resource/run.zip';

  let explorer = new ZipExplorer(path);
  beforeEach(() => {

  });

  test('should extract lzma compressed file', async () => {
    const p = 'C:\\Users\\pills\\code\\InterractiveUnzipper\\test\\resource\\1.log.xz';
    const buffer = fs.readFileSync(p);
    await new ZipExplorer(path).extractLZMACompressedFile(buffer, '1.txt')
  });

  // Do you want to extract by dir/sub zip/file name
  //
  // Your desired dir contains
  //
  // Your desired sub-zip file name contains
  //
  // Your desired file name contains
  //
  // Above files would be extracted, continue?

  test('should filter by regex', async () => {
    explorer = new ZipExplorer('test/resource/snapshot.zip');
    const files = await explorer.getAllFiles();
    let filtered = [];

    const dir = /snapshot.zip\/BTS1_1011_part_7.zip/;
    const name = /\.xml\.gz/;

    if(dir) {
      filtered = files.filter(byDir(dir))
    }

    if(name) {
      filtered = filtered.filter(byName(name))
    }

    function byDir(pathRegex) {
      return (file) => {
        return pathRegex.test(file.parentPath);
      }
    }

    function byName(name) {
      return (file) => {
        return name.test(file.path);
      }
    }

    const fileList = filtered.map(f => `${f.parentPath}/${f.path}`).join('\n');
    fs.writeFileSync('result.txt', fileList, 'utf-8')
  })


  test('should extract tar compressed file', async () => {
    const p = 'C:\\Users\\pills\\code\\InterractiveUnzipper\\test\\resource\\BTS1_123D_linux_logs.tar';
    await unZipper.Open.file(p)
      .then(d => d.extract({path: './'}));
  });

  test('should traverse all zip directory', async () => {
    explorer = new ZipExplorer('test/resource/snapshot.zip');
    const files = await explorer.getAllFiles();
    await Promise.all(files.filter(f => !f.isZip)
      .map(f => f.extractToDefault())
    );
  });

  test('should work for snapshot files', async () => {
    explorer = new ZipExplorer('test/resource/snapshot.zip');
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
