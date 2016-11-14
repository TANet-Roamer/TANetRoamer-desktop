if (require('electron-squirrel-startup')) return;
const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron'), {
    autoUpdater
  } = require('electron-auto-updater'),
  path = require('path'),
  url = require('url'),
  storage = require('electron-json-storage'),
  notify = require('electron-main-notification'),
  ua = require('universal-analytics');

const
  schools = require('./schools.json'),
  Account = require('./account.js'),
  globalValue = require('./globalValue');

let win, visitor, eventNum;

class EventNum {
  constructor(num) {
    this._num = num || 0;
  }
  inc() {
    this._num = this._num + 1;
    console.log('eventNum: ', this._num);
  }
  dec() {
    this._num = this._num - 1;
    console.log('eventNum: ', this._num);
    if (this._num <= 0) {
      console.log('close');
      app.quit();
    }
  }
}

function initUpdates() {

  autoUpdater.on('checking-for-update', () => {
    console.log('checking-for-update');
    eventNum.inc();
  });

  autoUpdater.on('update-available', () => {
    console.log('update-available');
    notify('TANet Roamer 校園網路漫遊器', {
      body: '發現新的版本，下載新版本安裝檔中。'
    }, openSettingPage);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('update-not-available');
    eventNum.dec();
  });

  autoUpdater.on('update-downloaded', (a, b, version, d, e, quitAndInstall) => {
    console.log('update-downloaded');
    eventNum.inc();
    notify('TANet Roamer 校園網路漫遊器', {
      body: `安裝檔下載完成，開始安裝新版本 v${version}`
    });
    quitAndInstall();
  });

  autoUpdater.checkForUpdates();
}

function genUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function openSettingPage() {
  eventNum.inc();
  visitor.event('main', 'openSettingPage').send();
  win = new BrowserWindow({
    width: 240,
    height: 420
  });

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'setting.html'),
    protocol: 'file:',
    slashes: true
  }));

  win.on('closed', () => {
    win = null;
    eventNum.dec();
  });
}

function genUA() {
  return new Promise((resolve, reject) => {
      storage.get('uuid', (err, data) => {
        if (!data.uuid) {
          const uuid = genUuid();
          storage.set('uuid', {
            uuid: uuid
          }, (err) => resolve(uuid));
        } else
          resolve(data.uuid);
      });
    })
    .then((uuid) => visitor = ua('UA-87283965-1', uuid));
}

const readyPromise = new Promise((resolve, reject) => {
  app.on('ready', () => {
    eventNum = new EventNum();
    resolve();
  });
});

Promise.all([genUA(), readyPromise])
  .then(() => {
    eventNum.inc();
    storage.get('user', (err, data) => {
      if (!data || !data.id || !data.password || !data.school_place)
        return openSettingPage();
      const cur_school = schools.find((e) => e.id === '0015');
      const account = new Account({
        id: data.id,
        pwd: data.password,
        apiUrl: 'http://securelogin.arubanetworks.com/auth/index.html/u',
        apiDataPattern: cur_school.data,
      });
      visitor = ua('UA-87283965-1', data.id);
      visitor.event('login', 'login').send();
      /* 登入 */
      account.login()
        .then((status) => {
          if (status.isSuccess) {
            initUpdates();
            visitor.event('login', 'success').send()
          } else
            visitor.event('login', 'failed').send();
          const noti = notify((status.isSuccess) ? globalValue.STRING_LOGIN_SUCCESS : globalValue.STRING_LOGIN_FAILED, {
            body: status.message
          }, openSettingPage, () => eventNum.dec());
        });
    });
  });
