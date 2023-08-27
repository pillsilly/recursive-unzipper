import path from 'path';

export function getFilePath(fileName: string) {
  return path.resolve(`./test/resource/${fileName}`);
}

export function getExtractedPath(fileName: string) {
  return path.resolve(`./test/resource/tmp/${fileName}.extracted`);
}

