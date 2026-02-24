import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    titleBarStyle: 'hidden',
    title: 'Qwen Code'
  });

  // Carrega o frontend React (vamos criar depois)
  win.loadFile('public/index.html');

  // Para desenvolvimento: abrir DevTools
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Exemplo de API para terminal
ipcMain.handle('run-command', async (_, cmd) => {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      resolve({
        output: stdout + stderr,
        error: err ? err.message : null
      });
    });
  });
});