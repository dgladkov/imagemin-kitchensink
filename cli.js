#!/usr/bin/env node
'use strict';
const meow = require('meow');
const getStdin = require('get-stdin');
const imagemin = require('.');
const ora = require('ora');
const plur = require('plur');
const stripIndent = require('strip-indent');

const cli = meow(`
  Usage
    $ imagemin-kitchensink <path|glob> ... --out-dir=build [--lossy]
    $ imagemin-kitchensink <file> > <output>
    $ cat <file> | imagemin-kitchensink > <output>
  Options
    -o, --out-dir  Output directory
    -l, --lossy Lossy compression
  Examples
    $ imagemin-kitchensink images/* --out-dir=build
    $ imagemin-kitchensink foo.png > foo-optimized.png
    $ cat foo.png | imagemin-kitchensink > foo-optimized.png
    $ imagemin-kitchensink --lossy >
`, {
  string: [
    'out-dir',
  ],
  alias: {
    o: 'out-dir',
    l: 'lossy',
  }
});

const run = (input, opts) => {

  const spinner = ora('Minifying images');

  if (Buffer.isBuffer(input)) {
    imagemin.buffer(input, opts.lossy).then(buf => process.stdout.write(buf));
    return;
  }

  if (opts.outDir) {
    spinner.start();
  }

  imagemin(input, opts.outDir, opts.lossy)
    .then(files => {
      if (!opts.outDir && files.length === 0) {
        return;
      }

      if (!opts.outDir && files.length > 1) {
        console.error('Cannot write multiple files to stdout, specify a `--out-dir`');
        process.exit(1);
      }

      if (!opts.outDir) {
        process.stdout.write(files[0].data);
        return;
      }

      spinner.stop();

      console.log(`${files.length} ${plur('image', files.length)} minified`);
    })
    .catch(err => {
      spinner.stop();
      throw err;
    });
};

if (!cli.input.length && process.stdin.isTTY) {
  console.error('Specify at least one filename');
  process.exit(1);
}

if (cli.input.length) {
  run(cli.input, cli.flags);
} else {
  getStdin.buffer().then(buf => run(buf, cli.flags));
}
