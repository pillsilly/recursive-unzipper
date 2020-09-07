const { ZipExplorer } = require('../src/ZipExplorer')

describe('Name of the group', () => {
    const path = 'test/resource/run.zip'

    let explorer = new ZipExplorer(path);
    beforeEach(() => {

    });


    test.only('should traverse all zip directory', async () => {
        explorer = new ZipExplorer('test/resource/snapshot.zip')

        const root = await explorer.getAllDir()

    });

    test('should work for snapshot files', async () => {
        explorer = new ZipExplorer('test/resource/snapshot.zip')
        const list = await explorer.listAll();

        const childrenZip = await list[0].getDirectory();
        // console.log(list)
    });

    test('should list all entry path', async () => {
        const list = await explorer.listAll().then(l => l.map(({ path }) => path));

        expect(list).toEqual([
            "123/",
            "123/run.js",
            "run.js",
        ]);
    });

    test('should list all entry path with given Regular expression', async () => {
        const list = await explorer.listAll(/.js/).then(l => l.map(({ path }) => path));
        expect(list).toEqual([
            "123/run.js",
            "run.js",
        ]);
    });

    afterEach(() => {

    });
});