const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const FlacFactory = require('libflacjs');
const { Encoder } = require('libflacjs/lib/encoder');

function waitForFlac(Flac) {
  if (Flac.isReady()) return Promise.resolve(Flac);
  return new Promise((resolve, reject) => {
    Flac.on('ready', () => resolve(Flac));
    Flac.on('error', reject);
  });
}

async function encodeFlac(channels, sampleRate) {
  const flac = await waitForFlac(FlacFactory());
  const pcm = channels.map(channel => {
    const result = new Int32Array(channel.length);
    for (let i = 0; i < channel.length; i++) result[i] = Math.round(Math.max(-1, Math.min(1, channel[i])) * 32767);
    return result;
  });
  const encoder = new Encoder(flac, { sampleRate, channels: pcm.length, bitsPerSample: 16, compression: 5, verify: false, isOgg: false });
  encoder.encode(pcm);
  encoder.encode();
  const result = encoder.getSamples();
  encoder.destroy();
  return result;
}

function createWindow() {
  const window = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 760,
    minHeight: 580,
    backgroundColor: '#f5f1e8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionCheckHandler(() => true);
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media');
  });

  ipcMain.handle('save-recording', async (_event, { bytes, suggestedName }) => {
    const result = await dialog.showSaveDialog({
      title: 'Save vinyl recording',
      defaultPath: suggestedName || 'vinyl-recording.wav',
      filters: [{ name: 'WAV audio', extensions: ['wav'] }]
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    await fs.writeFile(result.filePath, Buffer.from(bytes));
    return { canceled: false, filePath: result.filePath };
  });
  ipcMain.handle('encode-flac', async (_event, { channels, sampleRate }) => {
    try {
      const bytes = await encodeFlac(channels, sampleRate);
      return { bytes: new Uint8Array(bytes) };
    } catch (error) {
      throw new Error(`FLAC encoding failed: ${error.message}`);
    }
  });

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
