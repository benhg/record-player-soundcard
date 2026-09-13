function encodeWav(channels, sampleRate) {
  const channelCount = channels.length;
  const frameCount = channels[0]?.length || 0;
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + frameCount * channelCount * bytesPerSample);
  const view = new DataView(buffer);
  const write = (offset, value) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  write(0, 'RIFF'); view.setUint32(4, 36 + frameCount * channelCount * 2, true); write(8, 'WAVE');
  write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * 2, true); view.setUint16(32, channelCount * 2, true); view.setUint16(34, 16, true);
  write(36, 'data'); view.setUint32(40, frameCount * channelCount * 2, true);
  let offset = 44;
  for (let i = 0; i < frameCount; i++) for (let channel = 0; channel < channelCount; channel++) {
    const sample = Math.max(-1, Math.min(1, channels[channel][i] || 0));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true); offset += 2;
  }
  return buffer;
}

if (typeof module !== 'undefined') module.exports = { encodeWav };
