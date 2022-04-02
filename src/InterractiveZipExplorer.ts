'use strict';
import fs from 'fs'

let zipLocation = '';
import path from 'path'

const start:QuestionCollection = {
  type: 'input',
  name: 'start',
  message: "Input your zip path then press enter",
  validate: function (answer: string) {
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
const howToBrowse: QuestionCollection = {
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

const INPUT_REGEX:QuestionCollection = {
  type: 'input',
  name: 'INPUT_REGEX',
  message: "Type your regex:",
};

const filter = {
  type: 'input',
  name: 'filter',
  message: "put your regex here",
  when: function (answers: { browsingMode: string; }) {
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

let explorer: ZipExplorer;
import {MyFileType, ZipExplorer} from '../src/ZipExplorer';
import inquirer, {Answers, QuestionCollection} from 'inquirer';

inquirer.prompt(start)
  .then(() => {
    explorer = new ZipExplorer(zipLocation);
    return inquirer.prompt(howToBrowse).then((answer: Answers) => handleListFile(answer));
  });

async function handleListFile(browsingModeAnswer: { [key: string]: string; }): Promise<void> {
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


function handleRegexList(allFiles: MyFileType[], filterImpl: Function) {
  return inquirer.prompt(INPUT_REGEX).then(a => {
    const regex = new RegExp(a.INPUT_REGEX);
    allFiles.filter(filterImpl(regex)).forEach(printFileLocation);
  }).then(() => inquirer.prompt(howToBrowse).then(handleListFile));
}

function doesNotExist(answer: string) {
  const resolved = path.resolve(answer);
  const exist = fs.existsSync(resolved);
  console.info(`\n Resolved zip location ${resolved} does ${exist ? "" : "not"} exist`);
  return !exist;
}

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

function printFileLocation(f: MyFileType) {
  console.log(`${f.parentPath}/${f.path}`)
}
