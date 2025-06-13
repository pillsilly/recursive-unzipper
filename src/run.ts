import path from 'path';
import {Extractor, PluginFunctionsType} from './Extractor';
import fs from 'fs';

// extract below parameter types as new type
export type RunParameters = {
  file?: string;
  dir?: string;
  name?: string;
  dest?: string;
  bail?: boolean;
  map?: string;
  plugin?: {
    extract: {
      zip?: string;
      tar?: string;
      xz?: string;
      rar?: string;
    };
  };
};

async function run({file = '', dir = '', name = '', dest = '', bail = false, map = '', plugin = {
  // draw type for this parameter below:
  extract: {
    zip: '',
    tar: '',
    xz: '',
    rar: ''
  }
}}: RunParameters) {
  const extMapping = Extractor.appendExtMapping(map);
  const pluginFunctions= await getPluginFunctions(plugin.extract)
  const extractor = new Extractor({
    filePath: file,
    dest,
    bail,
    extMapping,
    pluginFunctions
  });
  await extractor.extract();
}

export {run, getPluginFunctions};


async function getPluginFunctions(locations: {[key in 'zip' | 'tar' | 'xz' | 'rar']: string} | {}) {
  const pluginFunctions: PluginFunctionsType = {}
  for (const key of Object.keys(locations)) {
    // @ts-ignore
    if (!locations[key]) continue;
    // @ts-ignore
    const pluginLocation = path.resolve(locations[key]);
    if (!fs.existsSync(pluginLocation)) continue;
    const extractorPluggedIn = require(pluginLocation).default || require(pluginLocation);
    if (typeof extractorPluggedIn !== 'function') {
      throw new Error(`Plugin at ${pluginLocation} is not a valid extractor function`);
    }
    const extractorPluggedInWrapperForAutomatedWriteToDisk = async (filePath: string, options: {dir: string}) => {
      return await extractorPluggedIn(filePath, options);
    }
    Object.assign(pluginFunctions, {[key]: extractorPluggedInWrapperForAutomatedWriteToDisk});
  }
  return pluginFunctions;
}
