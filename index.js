const imagemin = require('imagemin');
const execBuffer = require('exec-buffer');
const isPng = require('is-png');
const optipng = require('optipng-bin');
const pngout = require('pngout-bin');
const zopfli = require('zopflipng-bin');
const advpng = require('advpng-bin');

const plugin = ({ bin, args, predicate }) => buf => {
  if (!Buffer.isBuffer(buf)) {
    return Promise.reject(new TypeError('Expected a buffer'));
  }
  if (!predicate(buf)) {
    return Promise.resolve(buf);
  }
  return execBuffer({
    input: buf,
    bin,
    args
  }).catch(err => {
    err.message = err.stderr || err.message;
    throw err;
  });
};

const losslessPlugins = [
  plugin({
    bin: optipng,
    args: [
      '-o7',
      '-i0',
      '-out', execBuffer.output,
      execBuffer.input,
    ],
    predicate: isPng,
  }),
  plugin({
    bin: pngout,
    args: [
      execBuffer.input,
      execBuffer.output,
    ],
    predicate: isPng,
  }),
  plugin({
    bin: zopfli,
    args: [
      '--timelimit=20',
      '--iterations=21',
      '--filters=0pme',
      '--lossy_transparent',
      '-y',
      execBuffer.input,
      execBuffer.output,
    ],
    predicate: isPng,
  }),
  plugin({
    bin: advpng,
    args: [
      '-4',
      '-z',
      execBuffer.input,
    ],
    predicate: isPng,
  }),
];

const lossyPlugins = [

];

module.exports = (input, output, lossy) => {
  return imagemin(input, output, {
    plugins: lossy ? lossyPlugins.concat(losslessPlugins) : losslessPlugins,
  });
}
