const { ZipExplorer } = require('../src/ZipExplorer')

describe('Name of the group', () => {
    const path = 'test/resource/run.zip'

    let explorer = new ZipExplorer(path);
    beforeEach(() => {
        
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