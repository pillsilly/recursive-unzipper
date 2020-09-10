const {ZipExplorer} = require('../src/ZipExplorer');

module.exports = function run({file = ''}) {
  const explorer = new ZipExplorer(file);
  console.info(`Extracting  ${file}`);
  explorer.getAllFiles()
    .then(files => {
      return files.filter(file => !file.isZip)
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
