if (require('electron-squirrel-startup')) return;
const
  path = require('path'),
  url = require('url'),
  {
    app,
    BrowserWindow
  } = require('electron'),
  {
    autoUpdater
  } = require('electron-auto-updater'),
  storage = require('electron-json-storage'),
  Notification = require('electron-native-notification'),
  ua = require('universal-analytics'),
  isOnline = require('is-online'),
  log = require('npmlog'),
  program = require('commander');

const
  units = require('./units'),
  Account = require('./account'),
  globalValue = require('./globalValue');

/* 初始化 */
/* 儲存產品名稱與當前版本 */
process.env.PRODUCT_NAME = require('./package.json').productName;
process.env.PRODUCT_VERSION = `v${app.getVersion()}`;
/* 參數設定 */
program
  .version(process.env.PRODUCT_VERSION)
  .option('-l, --npmlog-level [value]', '指定 log 輸出層級。', 'info')
  .option('-c, --config-page', '開啟設定視窗。')
  .option('-n, --no-login', '開啟程式但不執行登入。')
  .option('-u, --user [value]', '以設定的值作為帳號。')
  .option('-p, --pwd [value]', '以設定的值作為密碼。')
  .option('-a, --api-url [value]', '以設定的值作為 API 網址。', /^http.*/, null)
  .option('-f, --form-data [value]', '以設定的值作為 FormData，以 urlencoded 表示。')
  .parse(process.argv);
log.addLevel('debug', 1500, {}, 'DEBUG'); /* 增加 debug 層，用來在測試中判斷程式狀態。 */
log.level = program.npmlogLevel; /* 設定 log 層級。 */
log.verbose('app start', 'product name: %j version: %j', process.env.PRODUCT_NAME, process.env.PRODUCT_VERSION);

let win;

const main = {

  /**
   * @function initUpdates 初始化自動更新元件
   */
  initUpdates: () => {
    /* 檢查更新 */
    autoUpdater.on('checking-for-update', () => {
      log.info('auto-update', 'checking-for-update');
    });
    /* 檢查到有新版本可以更新 */
    autoUpdater.on('update-available', () => {
      log.info('auto-update', 'update-available');
      const noti = new Notification('TANet Roamer 校園網路漫遊器', {
        body: '發現新的版本，下載新版本安裝檔中。'
      });
      noti.once('click', () => main.openSettingPage());
    });
    /* 沒有發現新版本 */
    autoUpdater.on('update-not-available', () => {
      log.info('auto-update', 'update-not-available');
    });
    /* 已下載完新版本安裝檔 */
    autoUpdater.on('update-downloaded', (a, b, version, d, e, quitAndInstall) => {
      log.info('auto-update', 'update-downloaded');
      new Notification('TANet Roamer 校園網路漫遊器', {
        body: `安裝檔下載完成，開始安裝新版本 v${version}`
      });
      quitAndInstall();
    });
    /* 檢查更新 */
    autoUpdater.checkForUpdates();
  },

  /**
   * @function openSettingPage 開啟設定頁面
   * @return {Promise} 設定頁面顯示時
   */
  openSettingPage: () => {
    log.info('openSettingPage');
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
    return new Promise((resolve, reject) => {
      win.once('show', () => {
        resolve();
      });
    });
  },

  /**
   * @function getUserData 從 storage 中取得使用者資料。
   * @return {Promise} [取得資料時]
   */
  getUserData: () => {
    return new Promise((resolve, reject) => {
      storage.get('user', (err, data) => {
        return resolve([program.user || data.user, program.pwd || data.pwd, data]);
      });
    });
  },

  /**
   * @function login 登入
   * @return {Promise} 第一個參數是登入狀態，成功為 true，失敗為 false
   */
  login: () => {
    log.info('login');
    return main.getUserData()
      .then(([user, pwd, data]) => {
        log.info('login', 'get user data: %j %j', user, pwd);
        if ((!user || !pwd) && program.configPage)
          return main.openSettingPage();
        /**
         * @const DEFAULT_SCHOOL_CONFIG 預設學校設定，基本上大部分的學校設定都是這樣。
         * @type {Object}
         */
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
        /**
         * @const school_studing 尋找所在學校的資料
         * @type {Object}
         */
        const school_studing = Object.assign(DEFAULT_SCHOOL_CONFIG, units.find((e) => e.id === data.school_studing));
        log.verbose('login', 'school studing: %j', school_studing);
        const account = new Account({
          user: user,
          pwd: pwd,
          apiUrl: program.apiUrl || school_studing.apiUrl,
          apiDataPattern: school_studing.data,
        });
        /* 登入 */
        return new Promise((resolve, reject) => {
          account.on('loginStart', () => {
            log.info('loginStart');
            const noti = new Notification(process.env.PRODUCT_NAME, {
              tag: 'loginStart',
              body: `使用 ${user} 帳號\n登入 ${school_studing.name}`,
            });
            noti.on('click', main.openSettingPage);
          });
          account.on('loginCompleted', (status) => {
            log.info('loginCompleted');
            /* 檢查是否連上網際網路。 */
            isOnline(function(err, online) {
              log.info('loginCompleted', 'is online: %j', online);
              /* 如果連上網路，則初始化自動更新元件。 */
              if (online)
                main.initUpdates();
            });
            const noti = new Notification((status.isSuccess) ? globalValue.STRING_LOGIN_SUCCESS : globalValue.STRING_LOGIN_FAILED, {
              tag: 'loginCompleted',
              body: status.message,
            });
            noti.onclick = main.openSettingPage;
            return resolve(status.isSuccess);
          });
          account.login();
        });
      })
      .catch((err) => log.error('login', err));
  },

}

Object.assign(process, main);
module.exports = main;

/* 判斷是否不是第一個開啟的程序。 */
const isSecondProcess = app.makeSingleInstance(() => /* 如果不是的話則讓主程序 login */ main.login());
/* 不是的話順便關閉程序 */
if (isSecondProcess)
  process.exit();

app.on('ready', () => {
  log.info('ready', 'App ready.');
  if (program.configPage)
    main.openSettingPage();
  if (program.login)
    main.login();
});
