import {$} from 'zx';
import {rimraf} from 'rimraf';

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

  it('should work with custom plugin for unknown extension via --plugin', async function() {
    const unknownFile = 'test/resource/sample_zip_contains_xz.zip';
    return $`npx ts-node src/bin.ts ${unknownFile} --plugin foo:test/example-zip.extractor.js`.then(po => {
      const output = po.toString().trim();
      expect(output).toContain('Extracting zip [');
      expect(output).toMatch(/Extraction (completed successfully)/);
    });
  }); 

  it('should work with custom plugin for rar via --plugin', async function() {
    const rarFile = 'test/resource/sample_rar_only.rar';
    return $`npx ts-node src/bin.ts ${rarFile} --plugin rar:test/example-rar.extractor.js`.then(po => {
      const output = po.toString().trim();
      expect(output).toMatch(/Extraction (completed successfully)/);
    });
  });
});