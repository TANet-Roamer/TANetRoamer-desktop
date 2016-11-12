const
  querystring = require('querystring'),
  Url = require('url'),
  fetch = require('node-fetch'),
  globalValue = require('./globalValue');

module.exports = class Account {
  constructor(option) {
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
    const searchParams = querystring.stringify(this._apiData);
    return this._client(this._apiUrl, searchParams)
      .then((res) => {
        const hash = decodeURI(new URL(res.url).search).replace(/^\?/, '').split('=');

        switch (hash.errmsg = hash[1]) {
          case globalValue.LOGIN_SUCCESS:
            return {
              isSuccess: true,
              message: globalValue.STRING_MSG_LOGIN_SUCCESS,
            };
            break;
          case globalValue.LOGIN_WRONG_PASSWORD:
            return {
              isSuccess: false,
              message: globalValue.STRING_MSG_WRONG_PASSWORD,
            };
            break;
          case globalValue.LOGIN_NO_INFORMATION:
            return {
              isSuccess: false,
              message: '',
            };
            break;
          case globalValue.ONLY_ONE_USER:
            return {
              isSuccess: false,
              message: globalValue.STRING_MSG_ONLY_ONE_USER,
            };
            break;
        }
      }, () => {
        return {
          isSuccess: false,
          message: globalValue.STRING_MSG_WRONG_SSID,
        }
      });
  }

  _client(url, postData) {
    return fetch(url, {
      method: 'post',
      body: postData,
    });
    /*
    const urlObj = Url.parse(url);
    const options = {
      hostname: urlObj.host,
      port: 80,
      path: urlObj.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, () => {
        let str = ''
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          str += chunk;
        });

        res.on('end', function() {
          console.log(str);
          resolve({
            body: str,
            url: res.url,
          });
        });
      });
      req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`);
        reject(e);
      });
      req.write(postData);
      req.end();
    });*/
  }
}
