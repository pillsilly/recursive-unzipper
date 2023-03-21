import {Extractor} from './Extractor';

async function run({file = '', dir = '', name = '', dest = '', bail = false}) {
  const extractor = new Extractor(file, dest, bail);
  await extractor.extract();
}

export {run};
