const test = require('node:test');
const assert = require('node:assert/strict');
const FlacFactory = require('libflacjs');
const { Encoder } = require('libflacjs/lib/encoder');

test('libFLAC encodes a valid native FLAC stream', async () => {
  const flac = FlacFactory();
  if (!flac.isReady()) await new Promise(resolve => flac.on('ready', resolve));
  const encoder = new Encoder(flac, { sampleRate: 44100, channels: 2, bitsPerSample: 16, compression: 5, verify: false, isOgg: false });
  encoder.encode([new Int32Array([0, 1000, -1000]), new Int32Array([0, 500, -500])]);
  encoder.encode();
  const bytes = encoder.getSamples();
  encoder.destroy();
  assert.equal(Buffer.from(bytes.slice(0, 4)).toString(), 'fLaC');
});
