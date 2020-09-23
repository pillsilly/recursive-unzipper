/**
 * Recursive prompt example
 * Allows user to choose when to exit prompt
 */

'use strict';
var inquirer = require('inquirer');
var output = [];
var zip = '';
var main = [{
  type: 'list',
  message: 'Browsing mode, you want to:',
  name: 'browsingMode',
  choices: [
    new inquirer.Separator('Browse by'),
    {
      name: 'List all files',
    },
    {
      name: 'List files by dir',
    },
    {
      name: 'List files by file name',
    }
  ],
  validate: function (answer) {
    if (answer.length < 1) {
      return 'You must choose at least one topping.';
    }

    return true;
  },
  when: function (answers) {
    if( answers.start && answers.start.endsWith('.zip') ) zip = answers.start.endsWith('.zip');

    return !!zip;
  }
},
  {
    type: 'input',
    name: 'filter',
    message: "put your regex here",
    when: function (answers) {
      return answers.browsingMode;
    },
  }];

var questions = [
  {
    type: 'input',
    name: 'start',
    message: "Input your zip path then press enter",
  },
  ...main
];

function ask(q) {
  inquirer.prompt(q).then((answers) => {
    if (answers.filter) {
      console.log('listing file here...')
      ask(main);
    } else {
      console.log('all done:', output.join(', '));
    }
  });
}

ask(questions);
