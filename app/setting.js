const
  storage = require('electron-json-storage'),
  form = document.forms[0],
  BLUE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYPj/HwADAgH/OSkZvgAAAABJRU5ErkJggg==';

/* "儲存"事件 */
form.onsubmit = (e) => {
  e.preventDefault();
  /* 將資訊同步至 Google account */
  const form = {
    school_place: e.target.querySelector('#school_place').value,
    school_studing: e.target.querySelector('#school_studing').value,
    id: e.target.querySelector('#id').value,
    password: e.target.querySelector('#pwd').value,
    autologin: e.target.querySelector('#autologin').checked
  };
  storage.set('user', form, () => {
    new Notification('設定成功');
    window.close();
  });
};

const errorHandler = (e) => {
  console.error(e)
};

/* 產生學校清單 */
const
  schools = require('./schools'),
  school_place = form.querySelector('[name=school_place]'),
  school_studing = form.querySelector('[name=school_studing]');
for (let i in schools) {
  const ele = document.createElement('option');
  ele.value = schools[i].id;
  ele.innerText = schools[i].name;
  school_studing.add(ele.cloneNode(true));
  if (hasData(schools[i])) {
    school_place.add(ele.cloneNode(true));
  }
}
recallInfo();
/* 回憶表單資訊 */
function recallInfo() {
  const targets = form.querySelectorAll('[name]');
  storage.get('user', (err, data) => {
    if (data.school_place) {
      targets[0].querySelector('[value="' + data.school_place + '"]').selected = true;
    }
    if (data.school_studing) {
      targets[ 1 ].querySelector('[value="' + data.school_studing + '"]').selected = true;
    }
    if (data.id) {
      targets[2].value = data.id;
    }
    if (data.password) {
      targets[3].value = data.password;
    }
    if (data.autologin) {
      targets[4].checked = data.autologin;
    }
  });
}

function hasData (school) {
  return school.apiUrl && school.data;
}
