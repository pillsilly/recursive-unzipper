import {Extractor, logger} from './Extractor';

async function run({file = '', dir = '', name = '', dest = ''}) {
  const extractor = new Extractor(file, dest);
  await extractor.extract();
}

export {run};
