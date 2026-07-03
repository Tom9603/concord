const { contextBridge, ipcRenderer } = require('electron');

// Pont sécurisé entre l'app Electron et l'interface React.
contextBridge.exposeInMainWorld('electron', {
  isDesktop: true,
  getVersion: () => ipcRenderer.invoke('app:version'),
  installUpdate: () => ipcRenderer.invoke('app:install-update'),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', cb),
});
