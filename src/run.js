const {ZipExplorer} = require('../src/ZipExplorer');

module.exports = function run({file = '', dir, name}) {
  const explorer = new ZipExplorer(file);
  console.info(`Extracting  ${file} with option dir=${dir} name=${name}`);
  explorer.getAllFiles()
    .then(files => {
      return filterByDirAndName({files, dir, name})
        .map(file => file.extractToDefault())
    })
    .then(() => {
      console.info('Extraction completed')
    })
    .catch((e) => {
      console.info(`Extraction failed ${e.stackTrace}`)
    })
    .finally(() => {
      console.info('Done')
    })
};


function filterByDirAndName({files, dir, name}) {
  let filtered = files;

  if (dir) {
    dir = new RegExp(dir);
    filtered = files.filter(byDir(dir))
  }

  if (name) {
    name = new RegExp(name);
    filtered = filtered.filter(byName(name))
  }

  return filtered;

  function byDir(pathRegex) {
    return (file) => {
      return pathRegex.test(file.parentPath);
    }
  }

  function byName(name) {
    return (file) => {
      return name.test(file.path);
    }
  }
}
