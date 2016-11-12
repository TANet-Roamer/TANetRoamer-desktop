const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron'),
  path = require('path'),
  url = require('url'),
  storage = require('electron-json-storage'),
  notify = require('electron-main-notification'),
  ua = require('universal-analytics');

const
  schools = require('./schools.json'),
  Account = require('./account.js'),
  globalValue = require('./globalValue');

let win, visitor;

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
    app.quit();
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
    resolve();
  });
});

Promise.all([genUA(), readyPromise])
  .then(() => {
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
          (status.isSuccess) ?
          visitor.event('login', 'success').send():
            visitor.event('login', 'failed').send();
          const noti = notify((status.isSuccess) ? globalValue.STRING_LOGIN_SUCCESS : globalValue.STRING_LOGIN_FAILED, {
            body: status.message
          }, openSettingPage, app.quit);
        });
    });
  });
