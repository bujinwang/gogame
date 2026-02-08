/**
 * Electron Main Process Entry Point
 * Simultaneous Go (同步围棋)
 */

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { setupIpcHandlers, cleanupIpc } = require('./src/main/ipc-handlers');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    minWidth: 900,
    minHeight: 700,
    title: '同步围棋 - Simultaneous Go',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#1a1a2e',
    show: false
  });

  mainWindow.loadFile('src/renderer/index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Set up IPC handlers
  setupIpcHandlers(mainWindow);

  // Dev tools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    cleanupIpc();
  });

  // Application menu
  const menuTemplate = [
    {
      label: '游戏',
      submenu: [
        {
          label: '新游戏',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-game');
          }
        },
        { type: 'separator' },
        {
          label: '断开连接',
          click: () => {
            cleanupIpc();
            mainWindow.webContents.send('menu-disconnect');
          }
        },
        { type: 'separator' },
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { role: 'resetZoom', label: '重置缩放' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '游戏规则',
          click: () => {
            mainWindow.webContents.send('menu-show-rules');
          }
        },
        {
          label: '关于',
          click: () => {
            mainWindow.webContents.send('menu-about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  cleanupIpc();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
