(function () {
  "use strict";

  const MOCK_DATA_AFTER = {
    status: "after",
    event: {
      title: "みどり小学校 夏まつり ラッフル抽選会",
      date: "2026年7月25日",
      venue: "みどり小学校 校庭 特設テント",
      description: "夏まつりラッフル券の当選番号をこちらのページで確認できます。",
      beforeMessage: "抽選結果は17:30以降に公開予定です。お手元のラッフル券を大切に保管してください。",
      afterMessage: "当選された方は、ラッフル券を持って景品交換テントまでお越しください。"
    },
    input: { numberLength: 4, placeholder: "例：0123" },
    prizes: [
      { name: "特賞：ファミリー防災セット", winningNumbers: ["0007", "0123", "0456"] },
      { name: "A賞：図書カードセット", winningNumbers: ["0011", "0234", "0789"] },
      { name: "B賞：お菓子詰め合わせ", winningNumbers: ["0033", "0555", "0999"] }
    ]
  };

  const MOCK_DATA_BEFORE = Object.assign({}, MOCK_DATA_AFTER, { status: "before", prizes: [] });
  const state = { data: null };

  /** アプリを起動し、設定に応じてデータを読み込みます。 */
  function init() {
    fetchRaffleData().then(renderApp).catch(showError);
    document.getElementById("raffle-form").addEventListener("submit", handleSubmit);
  }

  /** config.jsのdataModeに応じて、mockまたはJSONPでデータを取得します。 */
  function fetchRaffleData() {
    const config = window.RAFFLE_APP_CONFIG || {};
    if (config.dataMode === "jsonp") {
      return fetchJsonp(config.appsScriptUrl);
    }
    return Promise.resolve(config.mockStatus === "before" ? MOCK_DATA_BEFORE : MOCK_DATA_AFTER);
  }

  /** Apps ScriptのJSONPエンドポイントをscriptタグで読み込みます。 */
  function fetchJsonp(url) {
    return new Promise(function (resolve, reject) {
      if (!url || url.indexOf("YOUR_DEPLOYMENT_ID") !== -1) {
        reject(new Error("Apps Script URLが設定されていません。docs/config.jsを確認してください。"));
        return;
      }
      const callbackName = "raffleJsonpCallback_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const script = document.createElement("script");
      const separator = url.indexOf("?") === -1 ? "?" : "&";
      const timeoutId = window.setTimeout(function () {
        cleanup();
        reject(new Error("データの読み込みがタイムアウトしました。"));
      }, 10000);

      window[callbackName] = function (payload) {
        cleanup();
        resolve(payload);
      };
      script.onerror = function () {
        cleanup();
        reject(new Error("データを読み込めませんでした。"));
      };
      script.src = url + separator + "callback=" + encodeURIComponent(callbackName);
      document.body.appendChild(script);

      function cleanup() {
        window.clearTimeout(timeoutId);
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }
    });
  }

  /** 取得したデータを画面に反映します。 */
  function renderApp(data) {
    state.data = data;
    document.getElementById("event-title").textContent = data.event.title;
    document.getElementById("event-date").textContent = data.event.date;
    document.getElementById("event-venue").textContent = data.event.venue;
    document.getElementById("event-description").textContent = data.event.description;
    document.getElementById("status-message").textContent = data.status === "after" ? data.event.afterMessage : data.event.beforeMessage;
    document.getElementById("ticket-number").placeholder = data.input.placeholder || "例：0123";

    if (data.status === "after") {
      renderPrizes(data.prizes || []);
      document.getElementById("results-section").classList.remove("hidden");
      document.getElementById("checker-section").classList.remove("hidden");
    }
  }

  /** 賞ごとの当選番号一覧を表示します。 */
  function renderPrizes(prizes) {
    const list = document.getElementById("prize-list");
    list.innerHTML = "";
    prizes.forEach(function (prize) {
      const item = document.createElement("article");
      item.className = "prize-item";
      item.innerHTML = "<h3></h3><div class='numbers'></div>";
      item.querySelector("h3").textContent = prize.name;
      item.querySelector(".numbers").textContent = prize.winningNumbers.join(" / ");
      list.appendChild(item);
    });
  }

  /** 入力値を正規化して、当選番号に含まれるか確認します。 */
  function handleSubmit(event) {
    event.preventDefault();
    const data = state.data;
    const result = document.getElementById("check-result");
    const normalized = normalizeTicketNumber(document.getElementById("ticket-number").value, data.input.numberLength);
    result.className = "check-result";

    if (!normalized) {
      result.classList.add("invalid");
      result.textContent = "くじ番号を入力してください。";
      return;
    }
    if (!/^\d+$/.test(normalized)) {
      result.classList.add("invalid");
      result.textContent = "くじ番号は数字だけで入力してください。";
      return;
    }

    const matchedPrizes = (data.prizes || []).filter(function (prize) {
      return prize.winningNumbers.indexOf(normalized) !== -1;
    });

    if (matchedPrizes.length > 0) {
      result.classList.add("win");
      result.textContent = "おめでとうございます！あなたの番号「" + normalized + "」は「" + matchedPrizes.map(function (prize) { return prize.name; }).join("」「") + "」に当選しています。";
    } else {
      result.classList.add("lose");
      result.textContent = "確認しました。あなたの番号「" + normalized + "」は今回の当選番号には含まれていませんでした。ご参加ありがとうございました。";
    }
  }

  /** 全角数字を半角に変換し、前後空白を削除して、必要桁数までゼロ埋めします。 */
  function normalizeTicketNumber(value, numberLength) {
    const halfWidth = String(value || "").trim().replace(/[０-９]/g, function (char) {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });
    if (!halfWidth) return "";
    return halfWidth.padStart(Number(numberLength) || 0, "0");
  }

  /** 読み込みエラーを画面に表示します。 */
  function showError(error) {
    const section = document.getElementById("error-section");
    section.textContent = "データの読み込みに失敗しました。時間をおいて再度お試しください。(" + error.message + ")";
    section.classList.remove("hidden");
  }

  document.addEventListener("DOMContentLoaded", init);
}());
