const
  querystring = require('querystring'),
  EventEmitter = require('events'),
  Url = require('url'),
  fetch = require('node-fetch'),
  log = require('npmlog'),
  globalValue = require('./globalValue');

module.exports = class Account extends EventEmitter {

  constructor(option) {
    super();

    /* initial*/
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

  /* 使用 API 登入。 */
  login() {
    this.emit('loginStart');
    const urlencoded = querystring.stringify(this._apiData);
    log.info('account.login()', 'login with: %j', urlencoded);
    return this._client(this._apiUrl, urlencoded)
      .then((res) => {
        log.verbose('account.login()', 'response: %j', res);
        log.info('account.login()', 'response.url: %j', res.url);
        const
          hash = decodeURI(new URL(res.url).search).replace(/^\?/, ''),
          query = querystring.parse(hash);
        log.info('account.login()', 'response query: %j', query);
        let result = {};
        switch (query.errmsg) {
          case globalValue.LOGIN_SUCCESS:
            result = {
              isSuccess: true,
              message: globalValue.STRING_MSG_LOGIN_SUCCESS,
            };
            break;
          case globalValue.LOGIN_WRONG_PASSWORD:
            result = {
              isSuccess: false,
              message: globalValue.STRING_MSG_WRONG_PASSWORD,
            };
            break;
          case globalValue.LOGIN_NO_INFORMATION:
            result = {
              isSuccess: false,
              message: '',
            };
            break;
          case globalValue.ONLY_ONE_USER:
            result = {
              isSuccess: false,
              message: globalValue.STRING_MSG_ONLY_ONE_USER,
            };
            break;
        }
        log.info('account.login()', 'result: %j', result);
        this.emit('loginCompleted', result);
        return result;
      }, () => {
        log.info('account.login()', 'response error');
        const result = {
          isSuccess: false,
          message: globalValue.STRING_MSG_WRONG_SSID,
        };
        log.info('account.login()', 'result: %j', result);
        this.emit('loginCompleted', result);
        return result;
      });
  }

  _client(url, body) {
    return fetch(url, {
      method: 'post',
      redirect: 'manual',
      body: body,
    });
  }

};
