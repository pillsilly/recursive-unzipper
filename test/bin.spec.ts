import {$} from 'zx';
import {rimraf} from 'rimraf';
import {getExtractedPath} from './test-util';

describe('#bin.ts', () => {
  
  const filePath = 'test/resource/sample_zip_contains_xz.zip';

  afterEach(() => {
    for (const testFileName of [filePath]) {
      rimraf.rimrafSync(
        `${testFileName}.extracted`
      );
    }
  });
  
  it('should work when file is appointed by argument', async function() {
    return $`npx ts-node src/bin.ts ${filePath}`.then(po => {
      const output = po.toString().trim();

      expect(output).toContain('Extracting zip [');
    });
  });

  it('should work when file is appointed by option', async function() {
    return $`npx ts-node src/bin.ts -f ${filePath}`.then(po => {
      const output = po.toString().trim();

      expect(output).toContain('Extracting zip [');
    });
  });
});