# TANet Roamer

[![Build Status](https://travis-ci.org/ALiangLiang/TANetRoamer-desktop.svg?branch=master)](https://travis-ci.org/ALiangLiang/TANetRoamer-desktop) [![Build status](https://ci.appveyor.com/api/projects/status/96rf3aqlwwc4es93?svg=true)](https://ci.appveyor.com/project/ALiangLiang/tanetroamer-desktop) [![GitHub release](https://img.shields.io/github/release/ALiangLiang/TANetRoamer-desktop.svg)](https://github.com/ALiangLiang/TANetRoamer-desktop)[![Github All Releases](https://img.shields.io/github/downloads/ALiangLiang/TANetRoamer-desktop/total.svg)](https://github.com/ALiangLiang/TANetRoamer-desktop/)[![license](https://img.shields.io/github/license/ALiangLiang/TANetRoamer-desktop.svg)](https://github.com/ALiangLiang/TANetRoamer-desktop/blob/master/LICENSE)

## 宗旨

以最方便的操作流程，取得全台灣的 TANetRoaming WIFI 的漫遊認證。

![設定視窗](screenshot.png) ![登入通知](screenshot2.png)

目前需要各校同學的協助，讓大家都可以省下輸入帳號密碼的時間。協助請參考[開發](#開發 "開發")。

## 使用說明

一鍵登入校園 WI-FI 的桌面應用程式，目前測試中。

## 特色

- 一鍵登入校園 WI-FI ，方便快速。
- 自動更新。

## 支援學校 與 貢獻者

- 國立彰化師範大學 - ALiangLiang
- 國立中興大學 - ALiangLiang
- 國立中央大學 - ALiangLiang
- 國立中正大學 - BePsvPT (2016/11/13)
- (其他校園待測試)

## 開發

### app/schools.json

這個檔案是各校的設定檔，id 與 name 都已經準備好，就只差 url 與 data，url 為各校 WIFI 登入的 API 網址，data 則是傳送給 API 的資料，其中值為 %u 與 %p 的皆會被使用者設定的帳號與密碼取代。 若有學校的登入流程複雜或特殊，請[開 issue](issue/new) 討論是否更改程式結構。

```javascript
[{
  "id" : "0015", // 學校代碼，依照 https://ulist.moe.gov.tw/ 公布資訊為主
  "name" : "國立彰化師範大學", // 學校名稱
  "url" : "http://securelogin.arubanetworks.com/auth/index.html/u", // 登入 API 網址
  "data" : { // 送 API 的資料，視學校 API 而有所不同，此為彰師大設定。
    "user" : "%u", // 值為 '%u'，指的是帳號
    "password" : "%p", // 值為 '%p'，指的是密碼
    "cmd" : "authenticate",
    "Login" : "繼續"
  }
}]
```

### TODO

- [ ] 偵測 SSID 變更，全自動登入。
- [ ] 產品 icon。
- [x] 自動更新。
- [ ] 安全記憶帳號密碼。
- [ ] mac 版本支援。
- [ ] 增加測試 scripts。
- [ ] 憑證驗證，防止偽造 WIFI 熱點。
