const
  storage = require('electron-json-storage'),
  /* 讀取單位資訊清單 */
  units = require('./units'),
  form = document.forms[0],
  PRODUCT_NAME = require('./package.json').productName;

const realmEle = document.getElementById('realm');
/* "儲存"事件 */
form.onsubmit = (e) => {
  e.preventDefault();
  const
    formData = new FormData(e.target),
    formJson = {
      school_studing: formData.get('school_studing'),
      id_type: formData.get('id_type'),
      accounts: {
        normal: {
          user: formData.get('normal.user'),
          pwd: formData.get('normal.pwd'),
        },
        email: {
          user: formData.get('email.user'),
          pwd: formData.get('email.pwd'),
        },
        itw: {
          user: formData.get('itw.user'),
          pwd: formData.get('itw.pwd'),
        },
      },
    };
  /* 儲存設定 */
  storage.set('setting', formJson, () => {
    new Notification(PRODUCT_NAME, {
        tag: 'settingPageClosed',
        body: `已儲存您的設定，下次將使用「${(formJson.id_type === 'normal')?'校園帳號':(formJson.id_type === 'email')?'校園信箱':'iTaiwan帳號'}」登入`,
      })
      // .addEventListener('show', () => window.close());
  });
};

const school_studing = document.getElementById('school_studing');

/* 改變帳號後缀 */
function changeIdSuffix(suffix) {
  const
    selected = school_studing.value,
    school_place = units.find((school) => school.id === selected);
  if (school_place.realm)
    realmEle.innerText = '@' + school_place.realm;
  else
    realmEle.innerText = '';
}

school_studing.onchange = (e) => changeIdSuffix();

/* 帳號類型的 UI 互動 */
const account_type_select = Array.from(document.getElementsByClassName('account_type_select'));
account_type_select.forEach((e) => {
  e.onchange = (event) => {
    /* 隱藏所有種類的帳密欄位 */
    account_type_select.forEach((e) => document.getElementById(e.dataset.target).style.display = 'none');
    /* 顯示被點擊的指定帳密欄位 */
    document.getElementById(event.target.dataset.target).style.display = '';
  };
});

/* 新增"其他"選項 */
units.push({
  id: '9999',
  name: '其他',
  apiUrl: 'http://securelogin.arubanetworks.com/auth/index.html/u',
  data: {
    user: '%u',
    password: '%p',
    cmd: 'authenticate',
    Login: '繼續'
  },
});

/* 產生學校清單 */
for (let i in units) {
  const ele = document.createElement('option');
  ele.value = units[i].id;
  ele.innerText = units[i].name;
  if (hasData(units[i])) {
    school_studing.add(ele.cloneNode(true));
  }
}

/* 回憶表單資訊 */
(function recallInfo() {
  storage.get('setting', (err, data) => {
    if (data.school_studing)
      form.school_studing.value = data.school_studing;
    for (let k in data.accounts) {
      form[`${k}.user`].value = data.accounts[k].user || '';
      form[`${k}.pwd`].value = data.accounts[k].pwd || '';
    }
    if (data.autologin)
      form.autologin.checked = data.autologin;
    document.getElementById('id_type').querySelector(`input[value=${data.id_type || 'normal'}]`).click();
  });
})();

function hasData(school) {
  return school.apiUrl && school.data;
}
