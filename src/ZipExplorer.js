const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');
const each = require('async-each');


class ZipExplorer {

    constructor(zipPath) {
        this.traverseCompressedFiles = this.traverseCompressedFiles.bind(this)

        this.getsubfileDirs = this.getsubfileDirs.bind(this)
        this.walk = this.walk.bind(this)

        this.processDir = this.processDir.bind(this)
        this.addtoS = this.addtoS.bind(this)


        this.zipPath = zipPath;
        this.unzipDir = `${path.dirname(zipPath)}/${path.basename(zipPath).split('.').shift()}`;
    }


    async listAll(regex) {
        const buffer = fs.readFileSync(this.zipPath);

        const directory = await unzipper.Open.buffer(buffer);

        this.walk(directory);

        return regex ? directory.files.filter(file => regex.test(file.path))
            : directory.files
    }


    async getAllDir() {
        const buffer = fs.readFileSync(this.zipPath);

        const directory = await unzipper.Open.buffer(buffer);
        const sum = []
        await this.processDir(directory, sum)

        const ff = sum.map(xx => xx && xx.path);
        console.log(JSON.stringify(ff));
    }

    async processDir(directory, sum) {
        sum.push(...directory.files);
        console.log(`adding ${directory.files.length}`)
        const subzips = directory.files.filter(isZip);

        return Promise.all(subzips.map(zip => this.addtoS(sum)(zip)));
    }

    addtoS(sum) {
        return async (zip) => {
            const buffer = await zip.buffer();
            const directory = await unzipper.Open.buffer(buffer);
            await this.processDir(directory, sum);
        }
    }

    async getsubfileDirs(directory, sum = []) {
        const subfileDirs = await Promise.all(directory.files.filter(d => d.getDirectory).map(d => d.getDirectory()))
        sum.push(...directory.files);
        await each(subfileDirs, async (dir, next) => {
            if (dir.files && dir.files.length > 0) {
                await this.getsubfileDirs(dir, sum);
            }
        }, (e, content) => {
        })
        return subfileDirs;
    }

    walk(directory) {
        directory.files.forEach(this.traverseCompressedFiles)
    }

    traverseCompressedFiles(file) {
        if (file.path && file.path.endsWith('.zip')) {
            const getDirectory = async () => {
                console.log(`${file.path}`)
                const buffer = await file.buffer();
                const directory = await unzipper.Open.buffer(buffer);
                this.walk(directory)

                // const allDir = directory.files.filter(d => !!d.getDirectory).map(d => d.getDirectory());
                // const newdirs = await Promise.all(allDir);
                // newdirs.forEach(this.traverseCompressedFiles);

                return directory;
            }
            file.getDirectory = getDirectory;
        }
    }

    listTree() {

    }
}

module.exports = {
    ZipExplorer
}

function isZip(file) {
    return file.path && file.path.endsWith('.zip')
}