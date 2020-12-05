#!/usr/bin/env node
 console.log('Hello, world!');

var program = require('commander');

program
  .version('0.0.1')
  .option('-a, --all', 'List all of words')
  .option('-x, --regex', 'Match words with regex expression')
  .option('-w, --wildcard', 'Match words with wildcard expression')
  .parse(process.argv);
