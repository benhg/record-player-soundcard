const deviceSelect = document.querySelector('#input-device');
const status = document.querySelector('#status');
const timer = document.querySelector('#timer');
const meterFill = document.querySelector('#meter-fill');
const levelText = document.querySelector('#level-text');
const message = document.querySelector('#message');
const recordButton = document.querySelector('#record');
const stopButton = document.querySelector('#stop');
let stream, context, source, analyser, animation, startedAt, timerLoop, recording = false, chunks = [];

async function loadDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter(device => device.kind === 'audioinput');
    deviceSelect.innerHTML = '';
    inputs.forEach((device, index) => deviceSelect.add(new Option(device.label || `Audio input ${index + 1}`, device.deviceId)));
    if (!inputs.length) deviceSelect.add(new Option('No audio inputs found', ''));
    status.textContent = inputs.length ? 'Ready. Set the record player’s output volume so the meter stays green.' : 'No audio input detected yet.';
  } catch (error) { status.textContent = `Could not list audio inputs: ${error.message}`; }
}

function showLevel() {
  if (!analyser) return;
  const values = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(values);
  const rms = Math.sqrt(values.reduce((sum, value) => sum + (value - 128) ** 2, 0) / values.length) / 128;
  const percent = Math.min(100, Math.round(rms * 270)); meterFill.style.width = `${percent}%`; levelText.textContent = `${Math.round(rms * 100)}%`;
  animation = requestAnimationFrame(showLevel);
}
function formatTime(ms) { const total = Math.floor(ms / 1000); return [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60].map(x => String(x).padStart(2, '0')).join(':'); }

async function startRecording(simulated = false) {
  try {
    context = new AudioContext();
    stream = simulated ? createSimulator() : await navigator.mediaDevices.getUserMedia({ audio: { deviceId: deviceSelect.value ? { exact: deviceSelect.value } : undefined, channelCount: 2, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    source = context.createMediaStreamSource(stream); analyser = context.createAnalyser(); analyser.fftSize = 2048; source.connect(analyser); showLevel();
    const processor = context.createScriptProcessor(4096, 2, 2); const buffers = [[], []];
    processor.onaudioprocess = event => { if (!recording) return; const input = event.inputBuffer; const channels = Math.min(2, input.numberOfChannels); for (let c = 0; c < channels; c++) buffers[c].push(new Float32Array(input.getChannelData(c))); if (channels === 1) buffers[1].push(new Float32Array(input.getChannelData(0))); };
    source.connect(processor); processor.connect(context.destination); chunks = buffers; recording = true; startedAt = Date.now(); timerLoop = setInterval(() => timer.textContent = formatTime(Date.now() - startedAt), 250);
    recordButton.disabled = true; stopButton.disabled = false; deviceSelect.disabled = true; status.textContent = simulated ? 'Simulator is running.' : 'Recording live input…';
  } catch (error) { message.textContent = `Microphone access failed: ${error.message}`; }
}

function createSimulator() { const destination = context.createMediaStreamDestination(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.frequency.value = 440; gain.gain.value = 0.08; oscillator.connect(gain).connect(destination); oscillator.start(); return destination.stream; }
async function stopRecording() {
  if (!recording) return; recording = false; clearInterval(timerLoop); cancelAnimationFrame(animation); stream?.getTracks().forEach(track => track.stop()); source?.disconnect();
  const sampleCount = chunks[0].reduce((n, part) => n + part.length, 0); const channels = chunks.map(parts => { const result = new Float32Array(sampleCount); let offset = 0; parts.forEach(part => { result.set(part, offset); offset += part.length; }); return result; });
  const format = document.querySelector('#format').value; const stamp = new Date().toISOString().slice(0, 10); let bytes;
  if (format === 'flac') { status.textContent = 'Compressing to FLAC…'; const encoded = await window.vinylCapture.encodeFlac(channels, context.sampleRate); bytes = encoded.bytes; }
  else bytes = encodeWav(channels, context.sampleRate);
  const result = await window.vinylCapture.saveRecording(bytes, `vinyl-recording-${stamp}.${format}`);
  if (!result.canceled) message.textContent = `Saved ${result.filePath}`; status.textContent = 'Ready for another side.'; timer.textContent = '00:00:00'; meterFill.style.width = '0'; levelText.textContent = '—'; recordButton.disabled = false; stopButton.disabled = true; deviceSelect.disabled = false; await context.close();
}

recordButton.onclick = () => startRecording(false); stopButton.onclick = stopRecording; document.querySelector('#simulate').onclick = () => startRecording(true); document.querySelector('#refresh').onclick = loadDevices;
navigator.mediaDevices.addEventListener?.('devicechange', loadDevices); loadDevices();
