const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');


class ZipExplorer { 

    constructor(zipPath) { 
        this.zipPath = zipPath;
        this.unzipDir = `${path.dirname(zipPath)}/${path.basename(zipPath).split('.').shift()}`;
    }

    // return zip content as tree structure
    async listAll(regex) {
        const directory = await unzipper.Open.file(this.zipPath);

        return regex ? directory.files.filter(file => regex.test(file.path))
        :directory.files
    } 


    listTree() { 

    }
}

module.exports = {
    ZipExplorer
}