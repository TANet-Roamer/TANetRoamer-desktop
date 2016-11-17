const
  querystring = require('querystring'),
  EventEmitter = require('events'),
  Url = require('url'),
  fetch = require('node-fetch'),
  globalValue = require('./globalValue');

module.exports = class Account extends EventEmitter {

  constructor(option) {
    super();

    /* initial*/
    this._id = option.id;
    this._pwd = option.pwd;
    this._apiUrl = option.apiUrl;
    this._apiDataPattern = option.apiDataPattern;
    this._apiData = {};

    /* 整理 post data */
    this._apiData = Object.assign({}, this._apiDataPattern)
    for (let i in this._apiDataPattern) {
      if (this._apiDataPattern[i] === '%u')
        this._apiData[i] = this._id;
      if (this._apiDataPattern[i] === '%p')
        this._apiData[i] = this._pwd;
    }
  }

  /* 使用 API 登入。 */
  login() {
    this.emit('loginStart');
    const searchParams = querystring.stringify(this._apiData);
    return this._client(this._apiUrl, searchParams)
      .then((res) => {
        const hash = decodeURI(new URL(res.url).search).replace(/^\?/, '').split('=');
        let result = {};
        switch (hash[1]) {
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
        this.emit('loginCompleted', result);
        return result;
      }, () => {
        const result = {
          isSuccess: false,
          message: globalValue.STRING_MSG_WRONG_SSID,
        };
        this.emit('loginCompleted', result);
        return result;
      });
  }

  _client(url, postData) {
    return fetch(url, {
      method: 'post',
      body: postData,
    });
  }

};
