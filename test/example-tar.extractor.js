import tar from 'tar';

export default async function exampleTarExtractor(inputPath, options) {
  // make sure that, in this function, all extractable files are extracted to the dir of options.dir
  try {
    await tar.x({
      file: inputPath,
      strip: 1,
      C: options.dir, // alias for cwd:'some-dir', also ok
    });
  } catch (err) {
    console.error(err);
  }
}
