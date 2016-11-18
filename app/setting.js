const
  storage = require('electron-json-storage'),
  /* 讀取學校資訊清單 */
  units = require('./units'),
  form = document.forms[0],
  PRODUCT_NAME = require('./package.json').productName;

const realmEle = document.getElementById('realm');
/* "儲存"事件 */
form.onsubmit = (e) => {
  e.preventDefault();
  const
    formData = new FormData(e.target),
    formJson = {};
  for (var key of formData.keys())
    formJson[key] = formData.get(key);
  if ((formJson.id_type === 'email' || formJson.id_type === 'itw') && hasRealm())
    formJson.user += realmEle.innerText;
  /* 儲存設定 */
  storage.set('user', formJson, () => {
    new Notification(PRODUCT_NAME, {
      body: '設定成功',
    });
    window.close();
  });
};

const school_studing = document.getElementById('school_studing');

/* 隱藏帳號後缀 */
function disableIdSuffix() {
  realmEle.style.display = 'none';
  realmEle.parentNode.className = 'form-group';
}

/* 改變帳號後缀 */
function changeIdSuffix(suffix) {
  const
    selected = school_studing.value,
    school_place = units.find((school) => school.id === selected);
  if (suffix)
    realmEle.innerText = '@' + suffix;
  else
    realmEle.innerText = '@' + school_place.realm;
}

/* 顯示帳號後缀 */
function enableIdSuffix() {
  realmEle.style.display = '';
  realmEle.parentNode.className = 'input-group';
}

function hasRealm() {
  const
    selected = school_studing.value,
    school_place = units.find((school) => school.id === selected);
  return school_place.realm;
}

/* 檢查所屬學校資訊中是否有 realm */
function checkHasRealm() {
  if (hasRealm())
    enableIdSuffix() || changeIdSuffix();
  else
    disableIdSuffix();
}

school_studing.onchange = (e) => checkHasRealm();

/* 帳號類型的 UI 互動 */
const
  id_label = document.getElementById('id_label'),
  id_type_normal = document.getElementById('id_type_normal'),
  id_type_email = document.getElementById('id_type_email'),
  id_type_itw = document.getElementById('id_type_itw');
id_type_normal.onchange = (e) => {
  school_studing.disabled = true;
  id_label.innerText = '帳號';
  disableIdSuffix();
};
id_type_email.onchange = (e) => {
  school_studing.disabled = false;
  id_label.innerText = '信箱';
  checkHasRealm();
};
id_type_itw.onchange = (e) => {
  school_studing.disabled = true;
  id_label.innerText = 'iTaiwan 帳號';
  changeIdSuffix('itw');
  enableIdSuffix();
};

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
  storage.get('user', (err, data) => {
    if (data.school_studing)
      form.school_studing.value = data.school_studing;
    if (data.user)
      form.user.value = data.user.replace(/@.*/, '');
    if (data.pwd)
      form.pwd.value = data.pwd;
    if (data.autologin)
      form.autologin.checked = data.autologin;
    document.getElementById('id_type').querySelector(`input[value=${data.id_type}]`).click();
  });
})();

function hasData(school) {
  return school.apiUrl && school.data;
}
