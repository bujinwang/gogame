/**
 * 无先围棋 (WuxianGo) - Electron Main Process Entry Point
 * 
 * Copyright (C) 2026 三宝棋道工作室 (Sanbao Chess Studio)
 * Author: 步紧 (Bujin)
 * Version: 三宝001版 (v1.0.0-sanbao001)
 * 
 * All rights reserved. Unauthorized copying, modification, or distribution
 * of this software is strictly prohibited.
 */

const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { setupIpcHandlers, cleanupIpc } = require('./src/main/ipc-handlers');
const APP_INFO = require('./src/shared/app-info');

let mainWindow = null;

function createWindow() {
  const iconPath = path.join(__dirname, 'build', 'icon.icns');
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    minWidth: 900,
    minHeight: 700,
    title: `${APP_INFO.name} - ${APP_INFO.nameEn} | ${APP_INFO.versionDisplay}`,
    icon: iconPath,
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
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: `关于 ${APP_INFO.name}`,
              message: `${APP_INFO.name} (${APP_INFO.nameEn})`,
              detail: `版本: ${APP_INFO.versionFull}\n` +
                      `构建日期: ${APP_INFO.buildDate}\n\n` +
                      `${APP_INFO.copyright}\n` +
                      `作者: ${APP_INFO.author} (${APP_INFO.authorEn})\n` +
                      `工作室: ${APP_INFO.studio}\n\n` +
                      `${APP_INFO.description}\n\n` +
                      `许可: ${APP_INFO.license}`,
              buttons: ['确定']
            });
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
