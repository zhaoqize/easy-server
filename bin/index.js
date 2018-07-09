#!/usr/bin/env node

const program = require('commander');

program
  .version(require('../package').version)
  .usage('<command> [options]')

program
  .command('server <dir>')
  .description('a local server')
  .option('-p, --port <number>', 'select port to use, default: PORT env var or 8080')
  .option('-i, --ignore <path>', 'paths to ignore, default: node_modules')
  .option('-f, --file <path>', 'file entry , default: all')
  .action((dir, options) => {
      require('../lib/main.js')(dir, options);
  });

program.parse(process.argv);