if (require('electron-squirrel-startup')) return;
const
  path = require('path'),
  url = require('url'),
  {
    app,
    BrowserWindow,
    ipcMain
  } = require('electron'),
  {
    autoUpdater
  } = require('electron-auto-updater'),
  storage = require('electron-json-storage'),
  Notification = require('electron-native-notification'),
  ua = require('universal-analytics');

const
  schools = require('./schools.json'),
  Account = require('./account.js'),
  globalValue = require('./globalValue');

process.env.PRODUCT_NAME = require('./package.json').productName;

let win, visitor;

function initUpdates() {

  autoUpdater.on('checking-for-update', () => {
    console.log('checking-for-update');
  });

  autoUpdater.on('update-available', () => {
    console.log('update-available');
    const noti = new Notification('TANet Roamer 校園網路漫遊器', {
      body: '發現新的版本，下載新版本安裝檔中。'
    });
    noti.once('click', () => openSettingPage());
  });

  autoUpdater.on('update-not-available', () => {
    console.log('update-not-available');
  });

  autoUpdater.on('update-downloaded', (a, b, version, d, e, quitAndInstall) => {
    console.log('update-downloaded');
    new Notification('TANet Roamer 校園網路漫遊器', {
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
  visitor.event('main', 'openSettingPage').send();
  win = new BrowserWindow({
    width: 360,
    height: 440,
    title: process.env.PRODUCT_NAME,
    resizable: false,
  });
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'setting.html'),
    protocol: 'file:',
    slashes: true
  }));
  win.on('closed', () => win = null);
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
  app.on('ready', () => resolve());
});

const login = () => {
  storage.get('user', (err, data) => {
    if (!data || !data.user || !data.pwd)
      return openSettingPage();
    const DEFAULT_SCHOOL_CONFIG = {
      id: '9999',
      name: '',
      apiUrl: 'http://securelogin.arubanetworks.com/auth/index.html/u',
      data: {
        user: '%u',
        password: '%p',
        cmd: 'authenticate',
        Login: '繼續'
      },
    };
    const school_studing = Object.assign(DEFAULT_SCHOOL_CONFIG, schools.find((e) => e.id === data.school_studing));
    const account = new Account({
      user: data.user,
      pwd: data.password,
      apiUrl: school_studing.apiUrl,
      apiDataPattern: school_studing.data,
    });
    visitor = ua('UA-87283965-1', data.user);
    /* 登入 */
    account.on('loginStart', () => {
      visitor.event('login', 'login').send();
      const noti = new Notification(process.env.PRODUCT_NAME, {
        tag: 'loginStart',
        body: `使用 ${data.user} 帳號\n登入 ${school_studing.name}`,
      });
      noti.on('click', openSettingPage);
    });
    account.on('loginCompleted', (status) => {
      if (status.isSuccess) {
        initUpdates();
        visitor.event('login', 'success').send()
      } else
        visitor.event('login', 'failed').send();
      const noti = new Notification((status.isSuccess) ? globalValue.STRING_LOGIN_SUCCESS : globalValue.STRING_LOGIN_FAILED, {
        tag: 'loginCompleted',
        body: status.message,
      });
      noti.onclick = openSettingPage;
      noti.once('close');
    });
    account.login();
  });
};

/* 判斷是否不是第一個開啟的程序。 */
const isSecondProcess = app.makeSingleInstance(() => /* 如果不是的話則讓主程序 login */ login());
/* 不是的話順便關閉程序 */
if (isSecondProcess)
  process.exit();

Promise.all([genUA(), readyPromise])
  .then(login);
