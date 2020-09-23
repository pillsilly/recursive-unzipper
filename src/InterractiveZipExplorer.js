'use strict';
const fs = require('fs');
const inquirer = require('inquirer');
let zipLocation = '';
const path = require('path');

const start = {
  type: 'input',
  name: 'start',
  message: "Input your zip path then press enter",
  validate: function (answer) {
    if (!answer || !answer.endsWith('.zip') || doesNotExist(answer)) {
      return ` Your input [${answer}] is not a zip or not found in the disk`;
    }
    zipLocation = answer;
    return true;
  },
};
let LIST_ALL_FILES = 'List all files';
const LIST_BY_DIR = 'List files by dir';
const LIST_BY_NAME = 'List files by file name';
const howToBrowse = {
  type: 'list',
  message: 'You want to:',
  name: 'browsingMode',
  choices: [
    {
      name: LIST_ALL_FILES,
    },
    {
      name: LIST_BY_DIR,
    },
    {
      name: LIST_BY_NAME,
    }
  ],
  validate: function (answer) {
    if (answer.length < 1) {
      return 'You must choose at least one topping.';
    }

    return true;
  }
};

const INPUT_REGEX = {
  type: 'input',
  name: 'INPUT_REGEX',
  message: "Type your regex:",
};

const filter = {
  type: 'input',
  name: 'filter',
  message: "put your regex here",
  when: function (answers) {
    if (answers.browsingMode && answers.browsingMode === 'List all files') {
      return false;
    }
    return !!answers.browsingMode;
  },
};

const main = [
  howToBrowse,
  filter
];
const questions = [
  start,
  ...main
];


// function ask(q) {
//   inquirer.prompt(q).then((answers) => {
//     if (answers.filter) {
//       console.log(`listing file here...  regex is ${answers.filter}`);
//       ask(main);
//     } else {
//       console.log('all done:', output.join(', '));
//     }
//   });
// }
//
// ask(questions);
let explorer;
const {ZipExplorer} = require('../src/ZipExplorer');
inquirer.prompt(start)
  .then(() => {
    explorer = new ZipExplorer(zipLocation);
    return inquirer.prompt(howToBrowse).then(handleListFile);
  });

async function handleListFile(browsingModeAnswer) {
  console.log(`Going to ${browsingModeAnswer.browsingMode}... `);
  const allFiles = await explorer.getAllFiles();
  switch (browsingModeAnswer.browsingMode) {
    case LIST_ALL_FILES:
      allFiles.forEach(printFileLocation);
      break;
    case LIST_BY_DIR:
      return handleRegexList(allFiles, byDir);
    case LIST_BY_NAME:
      return handleRegexList(allFiles, byName);
  }

  return inquirer.prompt(howToBrowse).then(handleListFile);
}


function handleRegexList(allFiles, filterImpl) {
  return inquirer.prompt(INPUT_REGEX).then(a => {
    const regex = new RegExp(a.INPUT_REGEX);
    allFiles.filter(filterImpl(regex)).forEach(printFileLocation);
  }).then(() => inquirer.prompt(howToBrowse).then(handleListFile));
}

function doesNotExist(answer) {
  const resolved = path.resolve(answer);
  const exist = fs.existsSync(resolved);
  console.info(`\n Resolved zip location ${resolved} does ${exist ? "" : "not"} exist`);
  return !exist;
}

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

function printFileLocation(f) {
  console.log(`${f.parentPath}/${f.path}`)
}
