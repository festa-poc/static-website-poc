# ラッフル抽選結果表示Webアプリ PoC

Google Spreadsheets、Google Apps Script、GitHub Pagesを組み合わせて、小学校バザー向けのラッフル抽選結果を表示する静的WebアプリのPoCです。ビルドツールやnpmは不要で、`docs/` をGitHub Pagesの公開ディレクトリに指定するだけで動きます。

## 1. このPoCの概要

- 利用者はスマホやPCのブラウザで抽選結果を確認できます。
- 抽選前はイベント情報と「まだ公開されていません」という案内だけを表示し、当選番号や入力フォームは表示しません。
- 抽選後は賞ごとの当選番号を表示し、手元のくじ番号を入力して当選判定できます。
- 本番ではApps ScriptがSpreadsheetの内容をJSONPで返し、GitHub Pages側はそれを読み込みます。
- PoC確認用に、`dataMode: "mock"` ではローカルのダミーデータだけで動きます。

## 2. ディレクトリ構成

```text
.
├── README.md
├── apps-script/
│   └── Code.gs
├── docs/
│   ├── config.js
│   ├── index.html
│   ├── main.js
│   └── styles.css
└── samples/
    ├── settings.csv
    └── winners.csv
```

## 3. ローカルでの確認方法

もっとも簡単な確認方法は、ブラウザで `docs/index.html` を直接開くことです。

ローカルサーバーで確認する場合は、リポジトリ直下で以下を実行してください。

```bash
python3 -m http.server 8000 --directory docs
```

その後、ブラウザで `http://localhost:8000/` を開きます。

## 4. GitHub Pagesでの公開方法

1. GitHubのリポジトリ画面を開きます。
2. `Settings` → `Pages` を開きます。
3. `Build and deployment` のSourceを `Deploy from a branch` にします。
4. Branchは公開したいブランチを選び、Folderは `/docs` を選びます。
5. 保存後、表示されたGitHub PagesのURLを利用者向けURLとして案内します。

## 5. Google Spreadsheetの作り方

Spreadsheetに以下の2シートを作成します。

### settings

`samples/settings.csv` を取り込むか、以下の列構成で作成してください。

| key | value |
| --- | --- |
| status | before |
| title | さくら小学校 秋のバザー ラッフル抽選 |
| date | 2026年10月18日 |
| venue | さくら小学校 体育館 |
| description | ラッフル券の当選番号をこちらのページで確認できます。 |
| beforeMessage | 抽選結果は14:00以降に公開予定です。 |
| afterMessage | 当選された方は、ラッフル券を持って受付までお越しください。 |
| numberLength | 4 |
| placeholder | 例：0123 |

### winners

`samples/winners.csv` を取り込むか、以下の列構成で作成してください。

| prize | number |
| --- | --- |
| A賞：お楽しみギフトセット | 0007 |
| A賞：お楽しみギフトセット | 0123 |
| A賞：お楽しみギフトセット | 0456 |
| B賞：文房具セット | 0011 |
| B賞：文房具セット | 0234 |
| B賞：文房具セット | 0789 |
| C賞：お菓子セット | 0033 |
| C賞：お菓子セット | 0555 |
| C賞：お菓子セット | 0999 |

番号は先頭ゼロを保持するため、必要に応じて列の表示形式を「書式なしテキスト」にしてください。

## 6. Apps Scriptの設定方法

1. Spreadsheetで `拡張機能` → `Apps Script` を開きます。
2. `apps-script/Code.gs` の内容をApps Scriptエディタに貼り付けます。
3. `SPREADSHEET_ID` を実際のSpreadsheet IDに変更します。
4. `デプロイ` → `新しいデプロイ` を選択します。
5. 種類は `ウェブアプリ` を選択します。
6. 実行ユーザーは管理者本人、アクセスできるユーザーは運用方針に合わせて設定します。
7. デプロイ後に発行されるWebアプリURLを控えます。

Apps Scriptは `callback` パラメータがある場合はJSONP、ない場合はJSONとして返します。抽選前は `prizes: []` を返すため、当選番号を外部から見えない状態にできます。

## 7. `docs/config.js` の設定方法

PoCの初期状態は以下です。

```js
window.RAFFLE_APP_CONFIG = {
  dataMode: "mock",
  appsScriptUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  mockStatus: "after"
};
```

- `dataMode: "mock"`: `docs/main.js` 内のダミーデータを使います。
- `dataMode: "jsonp"`: `appsScriptUrl` のApps ScriptからJSONPで取得します。
- `mockStatus: "before"`: mockモードで抽選前表示を確認します。
- `mockStatus: "after"`: mockモードで抽選後表示を確認します。

本番公開時は `dataMode: "jsonp"` に変更し、`appsScriptUrl` を実際のデプロイURLに置き換えてください。

## 8. 抽選前から抽選後に切り替える方法

本番運用ではSpreadsheetの `settings` シートにある `status` を切り替えます。

- 抽選前: `status` を `before` にする
- 抽選後: `status` を `after` にする

重要: `before` の間はApps Scriptが `winners` シートを読んでもレスポンスには含めず、`prizes: []` を返します。

## 9. 本番運用時の注意点

- 抽選前に当選番号を公開データとして返さないこと。
- Spreadsheetを不用意に一般公開しないこと。
- くじ番号は個人情報と紐づけないこと。
- 当選番号は番号のみ扱い、氏名などは扱わないこと。
- 本番前にスマホで動作確認すること。
- 当日アクセスが集中しても、番号判定はブラウザ内で行うこと。
- GitHub Pages側には本番の当選番号を直接埋め込まないこと。
- 緊急時用に、静的なfallback手順を用意しておくこと。

補足: PoCのmockデータにはダミー当選番号が含まれます。本番では必ずJSONPモードに切り替え、GitHub Pages側へ本番の当選番号を直接書かないでください。

## 10. Jimdo Creatorからリンクする場合

Jimdo Creator側には、バザー公式ページ内に「ラッフル抽選結果はこちら」のようなボタンまたはテキストリンクを設置し、リンク先にGitHub PagesのURLを設定します。

例:

```text
https://<githubユーザー名>.github.io/<リポジトリ名>/
```

Jimdo側には抽選番号やSpreadsheetのURLを直接掲載せず、利用者はGitHub Pagesの表示ページだけを見る運用にしてください。
