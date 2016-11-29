/**
 * 這個檔案是用來建立一個模擬 TANet Roaming 認證頁面，
 * 目前是依據彰師大的頁面來製作，
 * 用來在本地端測試登入器是否能正確執行，
 * 若有其他不同的地方，例如網址結構，歡迎開 issue 討論。
 */

const
  express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  url = require('url'),
  multer = require('multer'),
  log = require('npmlog'),
  upload = multer();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

function setReturnTo(req, res, next) {
  const returnTo = req.get('Referer');
  if (returnTo)
    req.session.returnTo = returnTo;
  next();
}
app.get('/auth/index.html/u', function(req, res) {
  log.info('Test server');
  res.send('OK');
});
app.post('/auth/index.html/u', function(req, res) {
  log.info('Test server', 'receive data form: %j', req.body);
  if (req.body.user === 'testuser' && req.body.password === 'testpwd')
    res.redirect('https://www.google.com');
  else
    res.redirect('/auth/index.html/u?errmsg=Authentication failed');
});

const port = 8012;
module.exports = new Promise(function(resolve, reject) {
  app.listen(port, function() {
    log.info('Test server', `Create server on port ${port}.`);
    resolve(port);
  });
});
