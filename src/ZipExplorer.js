const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');
const each = require('async-each');
const _ = require('lodash')
class ZipExplorer {

    constructor(zipPath) {
        this.processDir = this.processDir.bind(this)
        this.addtoS = this.addtoS.bind(this)
        this.zipPath = zipPath;
        this.unzipDir = `${path.dirname(zipPath)}/${path.basename(zipPath).split('.').shift()}`;
    }

    async getAllFiles() {
        const buffer = fs.readFileSync(this.zipPath);
        const directory = await unzipper.Open.buffer(buffer);
        const sum = []
        await this.processDir(directory, sum, this.zipPath)
        return sum;
    }

    async processDir(directory, sum, zipPath) {
        directory.files.forEach(f => {
            f.parentPath = zipPath
            f.extractToDefault = async () => {
                const folder = _.replace(path.resolve(`${f.parentPath}`),/\.zip/g,'_zip');
                createDirIfNotExist(folder);
                const buffer = await f.buffer()
                fs.writeFileSync(`${folder}/${f.path}`, buffer);
            }
            f.isZip = isZip(f)
        })
        sum.push(...directory.files);
        const subzips = directory.files.filter(isZip);

        return Promise.all(subzips.map(zip => this.addtoS(sum)(zip)));
    }

    addtoS(sum) {
        return async (zip) => {
            const buffer = await zip.buffer();
            const directory = await unzipper.Open.buffer(buffer);
            await this.processDir(directory, sum, `${zip.parentPath}/${zip.path}`);
        }
    }
}

module.exports = {
    ZipExplorer
}

function isZip(file) {
    return file.path && file.path.endsWith('.zip')
}

function createDirIfNotExist(toCreateDir) {
    console.log(`creating dir ${toCreateDir}`)
    if (!fs.existsSync(toCreateDir))
        fs.mkdirSync(toCreateDir, {recursive: true});
}