import {MyFileType} from "./ZipExplorer";

const {ZipExplorer} = require('../src/ZipExplorer');

module.exports = function run({file = '', dir='', name=''}) {
  const explorer = new ZipExplorer(file);
  console.info(`Extracting  ${file} with option dir=${dir} name=${name}`);
  explorer.getAllFiles()
    .then((files: MyFileType[]) => {
      return filterByDirAndName({files, dir, name})
        .map((file: MyFileType) => file.extractToDefault())
    })
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


function filterByDirAndName({files, dir, name}: {files:MyFileType[], dir: string, name: string}) {
  let filtered = files;
  let dirRegex ;
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
    return (file: MyFileType) => {
      return pathRegex.test(file.parentPath);
    }
  }

  function byName(name: RegExp) {
    return (file: MyFileType) => {
      return name.test(file.path);
    }
  }
}
