const imagemin = require('imagemin');
const execBuffer = require('exec-buffer');
const isPng = require('is-png');
const isJpg = require('is-jpg');
const tempfile = require('tempfile');

// PNG
const optipng = require('optipng-bin');
const pngout = require('pngout-bin');
const zopfli = require('zopflipng-bin');
const advpng = require('advpng-bin');
// JPG
const jpegtran = require('jpegtran-bin');
const jpegoptim = require('jpegoptim-bin');

const typeCheckers = {
  png: isPng,
  jpg: isJpg,
};

const plugin = ({ bin, args, type, inplace = false }) => buf => {
  if (!Buffer.isBuffer(buf)) {
    return Promise.reject(new TypeError('Expected a buffer'));
  }
  if (!typeCheckers[type](buf)) {
    return Promise.resolve(buf);
  }
  const inputPath = tempfile('.' + type);
  const outputPath = inplace ? inputPath : tempfile('.' + type);
  return execBuffer({
    input: buf,
    bin,
    args,
    inputPath,
    outputPath,
  }).catch(err => {
    err.message = err.stderr || err.message;
    throw err;
  });
};

const losslessPlugins = [
  // PNG
  plugin({
    bin: optipng,
    args: [
      '-o7',
      '-i0',
      '-out', execBuffer.output,
      execBuffer.input,
    ],
    type: 'png',
  }),
  plugin({
    bin: pngout,
    args: [
      execBuffer.input,
      execBuffer.output,
    ],
    type: 'png',
  }),
  plugin({
    bin: zopfli,
    args: [
      '--iterations=21',
      '--filters=0pme',
      '--lossy_transparent',
      '-y',
      execBuffer.input,
      execBuffer.output,
    ],
    type: 'png',
  }),
  plugin({
    bin: advpng,
    args: [
      '-4',
      '-z',
      execBuffer.input,
    ],
    type: 'png',
    inplace: true,
  }),
  // JPG
  plugin({
    bin: jpegtran,
    args: [
      '-copy', 'none',
      '-optimize',
      '-outfile', execBuffer.output,
      execBuffer.input,
    ],
    type: 'jpg',
  }),
  plugin({
    bin: jpegoptim,
    args: [
      '--strip-all',
      '--all-normal',
      execBuffer.input,
    ],
    type: 'jpg',
    inplace: true,
  }),
];

const lossyPlugins = [
  // TODO add lossy JPEG/PNG pipeline
];

module.exports = (input, output, lossy = false) => {
  return imagemin(input, output, {
    plugins: lossy ? lossyPlugins.concat(losslessPlugins) : losslessPlugins,
  });
}
