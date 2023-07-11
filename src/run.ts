import {Extractor} from './Extractor';

async function run({file = '', dir = '', name = '', dest = '', bail = false, map = ''}) {
  const extMapping = Extractor.appendExtMapping(map);
  const extractor = new Extractor(file, dest, bail, extMapping);
  await extractor.extract();
}

export {run};
