import {Extractor} from '../src/Extractor';

describe('Extractor.appendExtMapping', () => {
  it('should return default mapping when no map is provided', () => {
    const result = Extractor.appendExtMapping(undefined);
    expect(result).toEqual({
      zip: ['.zip'],
      tar: ['.tar'],
      xz: ['.xz'],
    });
  });

  it('should append new extensions to the default mapping', () => {
    const result = Extractor.appendExtMapping('rar|zip,7z|tar');
    expect(result).toEqual({
      zip: ['.zip', '.rar'],
      tar: ['.tar', '.7z'],
      xz: ['.xz'],
    });
  });

  it('should throw an error for invalid mapping expressions', () => {
    expect(() => {
      Extractor.appendExtMapping('invalid|mapping');
    }).toThrow('Illegal mapping expression: invalid|mapping ');
  });

  it('should throw an error for invalid file types', () => {
    expect(() => {
      Extractor.appendExtMapping('rar|invalid');
    }).toThrow('Illegal mapping expression: rar|invalid ');
  });

  it('should handle empty extensions correctly', () => {
    const map = '|zip';
    const extMapping = Extractor.appendExtMapping(map);
    expect(extMapping.zip).toContain('');
  });
});
