/**
 * 這是一個測試檔案，測試流程如下：
 * 1. 在所有測試開始前，建立測試伺服器，port 為 8012。
 * 2. 逐一測試各種情況。
 */

const
  Application = require('spectron').Application,
  electron = require('electron'),
  assert = require('assert'),
  log = require('npmlog'),
  server = require('./testServer');

describe('application launch', function() {
  this.timeout(10000);

  before(function() {
    return server
      .then((port) => log.info('Test', `Create test server on port ${port} finish.`));
  });

  afterEach(function() {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('顯示設定頁面', function() {
    this.app = new Application({
      path: electron,
      args: ['app', '--enable-logging', '--no-login'],
    });
    return this.app.start()
      .then(() => delay(3000))
      .then(() => this.app.client.getWindowCount())
      .then((count) => assert.equal(count, 1)) /* only one fake browser. */
      .then(() => this.app.mainProcess.openSettingPage())
      .then(() => this.app.client.getWindowCount())
      .then((count) => assert.equal(count, 2)) /* one fake browser and one setting page. */
      .then(() => this.app.client.windowByIndex(1))
      .then(() => this.app.client.waitUntilWindowLoaded().browserWindow.isVisible())
      .then((result) => console.log(result))
      .catch((err) => log.error('Test', err));
  });

  it('登入成功', function() {
    this.app = new Application({
      path: electron,
      args: ['app', '--enable-logging', '-l', 'debug', '--user', 'testuser', '--pwd', 'testpwd', '--api-url', 'http://localhost:8012/auth/index.html/u'],
    });
    return this.app.start()
      .then(() => delay(3000))
      .then(() => this.app.client.getMainProcessLogs())
      .then((logs) => {
        for (let log of logs)
          if (loopMatch(['DEBUG', 'isSuccess', 'true'], log.split(' ')))
            return Promise.resolve();
        return Promise.reject();
      });
  });

  it('登入失敗，因為錯誤的帳密', function() {
    this.app = new Application({
      path: electron,
      args: ['app', '--enable-logging', '-l', 'debug', '--user', 'testuser', '--pwd', 'wrong', '--api-url', 'http://localhost:8012/auth/index.html/u'],
    });
    return this.app.start()
      .then(() => delay(3000))
      .then(() => this.app.client.getMainProcessLogs())
      .then((logs) => {
        for (let log of logs)
          if (loopMatch(['DEBUG', 'isSuccess', 'false'], log.split(' ')))
            return Promise.resolve();
        return Promise.reject();
      });
  });

  it('登入失敗，因為錯誤的 url 或 SSID', function() {
    this.app = new Application({
      path: electron,
      args: ['app', '--enable-logging', '-l', 'debug', '--user', 'testuser', '--pwd', 'testpwd', '--api-url', 'http://localhost:8012/auth/index.html/wrong'],
    });
    return this.app.start()
      .then(() => delay(3000))
      .then(() => this.app.client.getMainProcessLogs())
      .then((logs) => {
        for (let log of logs)
          if (loopMatch(['DEBUG', 'isSuccess', 'false'], log.split(' ')))
            return Promise.resolve();
        return Promise.reject('wrong url or SSID');
      });
  });
});

/* 延時 */
function delay(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), time);
  });
}

/* 檢驗兩個陣列是否全相同 */
function loopMatch(arr, target) {
  for (let i in arr)
    if (arr[i] !== target[i])
      return false;
  return true;
}
