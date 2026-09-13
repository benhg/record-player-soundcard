const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vinylCapture', {
  saveRecording: (bytes, suggestedName) => ipcRenderer.invoke('save-recording', { bytes, suggestedName }),
  encodeFlac: (channels, sampleRate) => ipcRenderer.invoke('encode-flac', { channels, sampleRate })
});
