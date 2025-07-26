import { log } from "console";
import extractor from 'extract-zip';

export default async function exampleZipExtractor(inputPath, options ) {
    // make sure that, in this function, all extractable files are extracted to the dir of options.dir
   await extractor(inputPath, {dir: options.dir});
   console.log(`Extracted files from ${inputPath} to ${options.dir}`);

};