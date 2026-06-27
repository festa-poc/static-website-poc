window.RAFFLE_APP_CONFIG = {
  // "mock" はこのPoCに同梱したダミーデータを使います。
  // "jsonp" は Google Apps Script のWebアプリからJSONPで取得します。
  dataMode: "mock",
  appsScriptUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",

  // mockModeを "before" / "after" に切り替えると、抽選前・抽選後の表示を確認できます。
  mockStatus: "after"
};
