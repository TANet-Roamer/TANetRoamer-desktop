# TANet Roamer [![Build Status](https://travis-ci.org/ALiangLiang/TANetRoamer-desktop.svg?branch=master)](https://travis-ci.org/ALiangLiang/TANetRoamer-desktop)

目前需要各校同學的協助，讓大家都可以省下輸入帳號密碼的時間。協助請參考[開發](#開發 "開發")。

## 宗旨
以最方便的操作流程，取得全台灣的 TANetRoaming WIFI 的漫遊認證。

## 使用說明
一鍵登入校園 WI-FI 的桌面應用程式，目前測試中。

## 特色
 - 記憶帳號密碼。
 - 一鍵登入校園 WI-FI ，方便快速。

## 適用學校
 - 國立彰化師範大學
 - 國立中興大學
 - 國立中央大學
 - 國立中正大學
 - (其他校園待測試)

## 開發

### app/schools.json

這個檔案是各校的設定檔，id 與 name 都已經準備好，就只差 url 與 data，url 為各校 WIFI 登入的 API 網址，data 則是傳送給 API 的資料，其中值為 %u 與 %p 的皆會被使用者設定的帳號與密碼取代。
若有學校的登入流程複雜或特殊，請[開 issue](/ALiangLiang/TANetRoamer-desktop/issue/new) 討論是否更改程式結構。

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

- [ ] 增加測試 scripts。
- [ ] 偵測 SSID 變更，全自動登入。
- [ ] 憑證驗證，防止偽造 WIFI 熱點。

## 貢獻

### 各校支援
 - 國立彰化師範大學 - ALiangLiang
 - 國立中興大學 - ALiangLiang
 - 國立中央大學 - ALiangLiang
 - 國立中正大學 - BePsvPT (2016/11/13)
