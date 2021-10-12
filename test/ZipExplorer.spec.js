const { ZipExplorer } = require('../src/ZipExplorer');
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
    await new ZipExplorer(path).extractLZMACompressedFile(buffer, '1.txt');
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
    const dir = /snapshot.zip\/BTS1_1011_part_7.zip/;
    const name = /\.xml\.gz/;

    let filtered = await explorer.getFiles({dir, name});
    
    const fileList = filtered.map(file => `${file.parentPath}/${file.path}`);

    expect(fileList).toEqual
      (["test/resource/snapshot.zip/BTS1_1011_part_7.zip/BTS1_1011_K9114705767_RMOD_L_1_SOAPMessageTrace.xml.gz",
        "test/resource/snapshot.zip/BTS1_1011_part_7.zip/BTS1_1011_K9114716501_RMOD_L_2_SOAPMessageTrace.xml.gz",
        "test/resource/snapshot.zip/BTS1_1011_part_7.zip/BTS1_1011_K9114705767_RMOD_L_1_SOAPMessageTraceStartup.xml.gz",
        "test/resource/snapshot.zip/BTS1_1011_part_7.zip/BTS1_1011_K9114716501_RMOD_L_2_SOAPMessageTraceStartup.xml.gz",
        "test/resource/snapshot.zip/BTS1_1011_part_7.zip/BTS1_1011_PM.BTS-1.20200825.070000.ANY.xml.gz",
        "test/resource/snapshot.zip/BTS1_1011_part_7.zip/BTS1_1011_RD.BTS-1.20200825.070000.ANY.xml.gz"
      ]);
  });


  test.skip('should extract tar compressed file', async () => {
    const p = 'C:\\Users\\pills\\code\\InterractiveUnzipper\\test\\resource\\BTS1_123D_linux_logs.tar';
    await unZipper.Open.file(p)
      .then(d => d.extract({ path: './' }));
  });

  test('should recrusively extract all zip files in zip', async () => {
    explorer = new ZipExplorer('test/resource/snapshot.zip');
    const files = await explorer.getAllFiles();
    await Promise.all(files.filter(f => !f.isZip)
      .map(f => f.extractToDefault())
    );
  });

  test.skip('should work for snapshot files', async () => {
    explorer = new ZipExplorer('test/resource/snapshot.zip');
    const list = await explorer.listAll();

    const childrenZip = await list[0].getDirectory();
    console.log(list);
  });

  test.skip('should list all entry path', async () => {
    const list = await explorer.listAll().then(l => l.map(({ path }) => path));

    expect(list).toEqual([
      "123/",
      "123/run.js",
      "run.js",
    ]);
  });

  test.skip('should list all entry path with given Regular expression', async () => {
    const list = await explorer.listAll(/.js/).then(l => l.map(({ path }) => path));
    expect(list).toEqual([
      "123/run.js",
      "run.js",
    ]);
  });

  afterEach(() => {

  });
});
