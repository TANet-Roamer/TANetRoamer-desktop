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
  ua = require('universal-analytics'),
  isOnline = require('is-online'),
  log = require('npmlog'),
  genUuid = require('./uuid-v4');

const
  units = require('./units.json'),
  Account = require('./account.js'),
  globalValue = require('./globalValue');

/* 初始化 */
/* 參數設定 */
process.argv.forEach(function(val, index, array) {
  /* 設定 log 的 level */
  if (val.startsWith('--log-level') || val.startsWith('-l') && !process.argv[index + 1].startsWith('-'))
    log.level = process.argv[index + 1];
});
/* 儲存產品名稱與當前版本 */
process.env.PRODUCT_NAME = require('./package.json').productName;
process.env.PRODUCT_VERSION = `v${require('./package.json').version}`;
log.verbose('app start', 'product name: %j version: %j', process.env.PRODUCT_NAME, process.env.PRODUCT_VERSION);

let win, visitor;

function initUpdates() {

  autoUpdater.on('checking-for-update', () => {
    log.info('auto-update', 'checking-for-update');
  });

  autoUpdater.on('update-available', () => {
    log.info('auto-update', 'update-available');
    const noti = new Notification('TANet Roamer 校園網路漫遊器', {
      body: '發現新的版本，下載新版本安裝檔中。'
    });
    noti.once('click', () => openSettingPage());
  });

  autoUpdater.on('update-not-available', () => {
    log.info('auto-update', 'update-not-available');
  });

  autoUpdater.on('update-downloaded', (a, b, version, d, e, quitAndInstall) => {
    log.info('auto-update', 'update-downloaded');
    new Notification('TANet Roamer 校園網路漫遊器', {
      body: `安裝檔下載完成，開始安裝新版本 v${version}`
    });
    quitAndInstall();
  });

  autoUpdater.checkForUpdates();
}

function openSettingPage() {
  log.info('openSettingPage');
  visitor.event('main', 'openSettingPage').send();
  win = new BrowserWindow({
    width: 360,
    height: 440,
    title: process.env.PRODUCT_NAME,
    resizable: false,
    defaultEncoding: 'UTF-8',
  });
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'setting.html'),
    protocol: 'file:',
    slashes: true
  }));
  win.on('closed', () => {
    win = null;
    log.info('openSettingPage', 'setting page closed.');
  });
}

const genUA = new Promise((resolve, reject) => {
    storage.get('uuid', (err, data) => {
      log.verbose('login', 'get uuid data: %j', data);
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

const readyPromise = new Promise((resolve, reject) => {
  app.on('ready', () => {
    log.info('ready', 'app ready.');;
    return resolve();
  });
});

const login = () => {
  log.info('login');
  storage.get('user', (err, data) => {
    log.info('login', 'get user data: %j', data);
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
    const school_studing = Object.assign(DEFAULT_SCHOOL_CONFIG, units.find((e) => e.id === data.school_studing));
    log.verbose('login', 'school studing: %j', school_studing);
    const account = new Account({
      user: data.user,
      pwd: data.pwd,
      apiUrl: school_studing.apiUrl,
      apiDataPattern: school_studing.data,
    });
    /* 登入 */
    account.on('loginStart', () => {
      log.info('loginStart');
      visitor
        .event({
          eventCategory: 'login',
          eventAction: 'login',
          applicationName: 'TANet-Roamer',
          applicationVersion: process.env.PRODUCT_VERSION,
        })
        .send();
      const noti = new Notification(process.env.PRODUCT_NAME, {
        tag: 'loginStart',
        body: `使用 ${data.user} 帳號\n登入 ${school_studing.name}`,
      });
      noti.on('click', openSettingPage);
    });

    account.on('loginCompleted', (status) => {
      log.info('loginCompleted');
      isOnline(function(err, online) {
        log.info('loginCompleted', 'is online: %j', online);
        if (online)
          initUpdates();
      });
      visitor
        .event({
          eventCategory: (status.isSuccess) ? 'login_success' : 'login_failed',
          eventAction: 'user',
          eventLabel: data.user,
          applicationName: 'TANet-Roamer',
          applicationVersion: process.env.PRODUCT_VERSION,
        })
        .event({
          eventCategory: (status.isSuccess) ? 'login_success' : 'login_failed',
          eventAction: 'school_id',
          eventLabel: school_studing.id,
          applicationName: 'TANet-Roamer',
          applicationVersion: process.env.PRODUCT_VERSION,
        })
        .send();
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

Promise.all([genUA, readyPromise])
  .then(login);
