const {ZipExplorer} = require('../src/ZipExplorer')

module.exports = function run({file = ''}) {
  const explorer = new ZipExplorer(file)
  explorer.getAllFiles()
    .then(files => {
      return files.filter(file => !file.isZip)
        .map(file => file.extractToDefault())
    })
};
