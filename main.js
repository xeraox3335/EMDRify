const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const displaySetup = require('./display-setup');

function getUnionBounds(displays) {
  const leftEdge = Math.min(...displays.map((display) => display.bounds.x));
  const topEdge = Math.min(...displays.map((display) => display.bounds.y));
  const rightEdge = Math.max(...displays.map((display) => display.bounds.x + display.bounds.width));
  const bottomEdge = Math.max(...displays.map((display) => display.bounds.y + display.bounds.height));

  return {
    x: leftEdge,
    y: topEdge,
    width: rightEdge - leftEdge,
    height: bottomEdge - topEdge
  };
}

function getConfiguredDisplays(allDisplays) {
  const indexes = Array.isArray(displaySetup.monitorIndexes) ? displaySetup.monitorIndexes : [];

  if (indexes.length === 0) {
    return [screen.getPrimaryDisplay()];
  }

  const selected = indexes
    .map((index) => allDisplays[index])
    .filter(Boolean);

  return selected.length > 0 ? selected : [screen.getPrimaryDisplay()];
}

function createWindow() {
  const allDisplays = screen.getAllDisplays().sort((a, b) => a.bounds.x - b.bounds.x);
  const configuredDisplays = getConfiguredDisplays(allDisplays);
  const useSpanMode = displaySetup.mode === 'manual-span' && configuredDisplays.length > 1;
  const targetBounds = useSpanMode
    ? getUnionBounds(configuredDisplays)
    : configuredDisplays[0].bounds;

  const startInFullscreen = !useSpanMode;

  const mainWindow = new BrowserWindow({
    x: targetBounds.x,
    y: targetBounds.y,
    width: targetBounds.width,
    height: targetBounds.height,
    fullscreen: startInFullscreen,
    frame: !useSpanMode,
    autoHideMenuBar: true,
    backgroundColor: '#0b1020',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  if (useSpanMode) {
    mainWindow.setBounds(targetBounds);
    mainWindow.setFullScreen(false);
  } else {
    mainWindow.once('ready-to-show', () => {
      mainWindow.setFullScreen(true);
    });
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