import {FileHandlerType, ZipExplorer} from "./ZipExplorer";
const BluebirdPromise  = require("bluebird");
async function run({file = '', dir = '', name = ''}) {
  const explorer = new ZipExplorer(file);
  console.info(`Extracting  ${file} with option dir=${dir} name=${name}`);

  let files = await explorer.getAllFiles();
  files = filterByDirAndName({files, dir, name})
  return BluebirdPromise 
    .each(
      files,
      (file: FileHandlerType) => file.extractToDefault()
    )
    .then(() => {
      console.info('Extraction completed')
    })
    .catch((e: { stackTrace: any; }) => {
      console.info(`Extraction failed ${e.stackTrace}`)
    })
    .finally(() => {
      console.info('Done')
    })
};

function filterByDirAndName({files, dir, name}: { files: FileHandlerType[], dir: string, name: string }) {
  let filtered = files;
  let dirRegex;
  let nameRegex;
  if (dir) {
    dirRegex = new RegExp(dir);
    filtered = files.filter(byDir(dirRegex))
  }

  if (name) {
    nameRegex = new RegExp(name);
    filtered = filtered.filter(byName(nameRegex))
  }

  return filtered;

  function byDir(pathRegex: RegExp) {
    return (file: FileHandlerType) => {
      return pathRegex.test(file.parentPath);
    }
  }

  function byName(name: RegExp) {
    return (file: FileHandlerType) => {
      return name.test(file.path);
    }
  }
}


export {run};
