const test = require('node:test');
const assert = require('node:assert/strict');
const { encodeWav } = require('../src/wav');

test('encodes stereo PCM WAV with a valid RIFF header', () => {
  const wav = encodeWav([new Float32Array([0, 1, -1]), new Float32Array([0.5, 0, -0.5])], 44100);
  const view = new DataView(wav);
  assert.equal(new TextDecoder().decode(new Uint8Array(wav, 0, 4)), 'RIFF');
  assert.equal(new TextDecoder().decode(new Uint8Array(wav, 8, 4)), 'WAVE');
  assert.equal(view.getUint16(22, true), 2);
  assert.equal(view.getUint32(24, true), 44100);
  assert.equal(view.getUint32(40, true), 12);
});
