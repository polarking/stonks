/* eslint-disable prefer-destructuring */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint global-require: off, no-console: off, promise/always-return: off */

import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import fetch from 'node-fetch';
import { StockInfo } from '../common/types';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    // autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const fetchStockInfo = async (symbol: string): Promise<StockInfo> => {
  const stockInfo: StockInfo = { symbol };

  const result = await fetch(`https://finance.yahoo.com/quote/${symbol}`);

  if (result.ok) {
    const text = await result.text();

    let reg = /"currentPrice":{\S+?}/gm;
    let match = reg.exec(text);
    if (match) {
      console.log(match[0]);
      stockInfo.currentPrice = (
        JSON.parse(`{${match[0]}}`) as {
          currentPrice: { raw: number; fmt: string };
        }
      ).currentPrice.raw;
    }

    reg = /<title>(.+?)\s\(/gm;
    match = reg.exec(text);
    if (match) {
      console.log(match[1]);
      stockInfo.longName = match[1];
    }

    reg = /"website":"https:\\u002F\\u002F(\S+?)"/gm;
    match = reg.exec(text);
    if (match) {
      console.log(match[1]);
      stockInfo.logo_url = `https://logo.clearbit.com/${match[1]}`;
    }

    reg = /Currency in (\w+)/gm;
    match = reg.exec(text);
    if (match) {
      console.log(match[1]);
      stockInfo.currency = match[1];
    }

    reg = /"previousClose":{\S+?}/gm;
    match = reg.exec(text);
    if (match) {
      console.log(match[0]);
      stockInfo.previousClose = (
        JSON.parse(`{${match[0]}}`) as {
          previousClose: { raw: number; fmt: string };
        }
      ).previousClose.raw;
    }
  }

  return stockInfo;
};

ipcMain.on('get-symbol', async (event, symbols: string[]) => {
  console.log('SYMBOLS', symbols);
  const stockInfo: StockInfo[] = [];

  for (let i = 0; i < symbols.length; i++) {
    try {
      stockInfo.push(await fetchStockInfo(symbols[i]));
    } catch (e) {
      console.error('ERROR', e);
    }
  }

  event.reply('get-symbol', stockInfo);
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
