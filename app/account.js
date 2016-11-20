const
  querystring = require('querystring'),
  EventEmitter = require('events'),
  Url = require('url'),
  fetch = require('node-fetch'),
  log = require('npmlog'),
  globalValue = require('./globalValue');

/**
 * @class Account 帳戶
 */
class Account extends EventEmitter {

  /**
   * @constructs Account
   * @param {Object} option
   */
  constructor(option) {
    super();

    /* 初始化*/
    this._user = option.user;
    this._pwd = option.pwd;
    this._apiUrl = option.apiUrl;
    this._apiDataPattern = option.apiDataPattern;
    this._apiData = {};

    /* 整理 post data */
    this._apiData = Object.assign({}, this._apiDataPattern)
    for (let i in this._apiDataPattern) {
      /* 以帳號與密碼取代原本 value 為 %u 與 %p */
      if (this._apiDataPattern[i] === '%u')
        this._apiData[i] = this._user;
      if (this._apiDataPattern[i] === '%p')
        this._apiData[i] = this._pwd;
    }
  }

  /**
   * 使用 API 登入。
   * @return {Promise} 登入結果。
   */
  login() {
    this.emit('loginStart');
    const urlencoded = querystring.stringify(this._apiData);
    log.info('account.login()', 'login to: %j', this._apiUrl);
    log.info('account.login()', 'login with: %j', urlencoded);
    return this._client(this._apiUrl, urlencoded)
      .then((res) => {
        log.verbose('account.login()', 'response: %j', res);
        log.info('account.login()', 'response.url: %j', res.url);
        /* 從轉址的 query 中，判斷此次登入的結果 */
        const query = Url.parse(res.url, true).query;
        log.info('account.login()', 'response query: %j', query);
        let result = {};
        if (query.errmsg == globalValue.LOGIN_SUCCESS) /* undefined == null */
          result = {
            isSuccess: true,
            message: globalValue.STRING_MSG_LOGIN_SUCCESS,
          };
        else if (query.errmsg === globalValue.LOGIN_WRONG_PASSWORD)
          result = {
            isSuccess: false,
            message: globalValue.STRING_MSG_WRONG_PASSWORD,
          };
        else if (query.errmsg === globalValue.LOGIN_NO_INFORMATION)
          result = {
            isSuccess: false,
            message: '',
          };
        else if (query.errmsg === globalValue.ONLY_ONE_USER)
          result = {
            isSuccess: false,
            message: globalValue.STRING_MSG_ONLY_ONE_USER,
          };
        log.info('account.login()', 'result: %j', result);
        log.info('account.login()', 'status: %j', isSuccess);
        log.debug('isSuccess', result.isSuccess);
        this.emit('loginCompleted', result);
        return result;
      }, (err) => {
        log.verbose('account.login()', err)
        log.info('account.login()', 'response error');
        const result = {
          isSuccess: false,
          message: globalValue.STRING_MSG_WRONG_SSID,
        };
        log.info('account.login()', 'result: %j', result);
        log.debug('isSuccess', result.isSuccess);
        this.emit('loginCompleted', result);
        return result;
      });
  }

  _client(url, body) {
    return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: body,
      })
      .then((res) => {
        /* 當出現例如 404 Not found 的情況，導至 reject flow。 */
        if (res.ok)
          return Promise.resolve(res);
        else
          return Promise.reject(res);
      });
  }

};

module.exports = Account;
