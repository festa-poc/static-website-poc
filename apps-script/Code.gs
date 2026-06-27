const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const SETTINGS_SHEET_NAME = "settings";
const WINNERS_SHEET_NAME = "winners";

/** Spreadsheetの内容をJSONまたはJSONPで返します。 */
function doGet(e) {
  const callback = e && e.parameter ? e.parameter.callback : "";
  const payload = buildPayload_();
  const json = JSON.stringify(payload);

  if (callback) {
    if (!isSafeCallbackName_(callback)) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Invalid callback" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/** settings / winnersシートからフロントエンド用データを作成します。 */
function buildPayload_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const settings = readSettings_(spreadsheet.getSheetByName(SETTINGS_SHEET_NAME));
  const status = settings.status === "after" ? "after" : "before";

  return {
    status: status,
    event: {
      title: settings.title || "",
      date: settings.date || "",
      venue: settings.venue || "",
      description: settings.description || "",
      beforeMessage: settings.beforeMessage || "",
      afterMessage: settings.afterMessage || ""
    },
    input: {
      numberLength: Number(settings.numberLength || 4),
      placeholder: settings.placeholder || "例：0123"
    },
    prizes: status === "after" ? readPrizes_(spreadsheet.getSheetByName(WINNERS_SHEET_NAME)) : []
  };
}

/** settingsシートをkey/valueのオブジェクトに変換します。 */
function readSettings_(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  const settings = {};
  values.slice(1).forEach(function (row) {
    const key = String(row[0] || "").trim();
    if (key) settings[key] = String(row[1] || "").trim();
  });
  return settings;
}

/** winnersシートを賞ごとの当選番号配列に変換します。 */
function readPrizes_(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  const prizeMap = {};
  const prizeOrder = [];

  values.slice(1).forEach(function (row) {
    const prizeName = String(row[0] || "").trim();
    const number = String(row[1] || "").trim();
    if (!prizeName || !number) return;
    if (!prizeMap[prizeName]) {
      prizeMap[prizeName] = [];
      prizeOrder.push(prizeName);
    }
    prizeMap[prizeName].push(number);
  });

  return prizeOrder.map(function (name) {
    return { name: name, winningNumbers: prizeMap[name] };
  });
}

/** JSONPのcallbackとして安全なJavaScript関数名だけを許可します。 */
function isSafeCallbackName_(callback) {
  return /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback);
}
