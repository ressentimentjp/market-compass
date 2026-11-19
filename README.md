# Market Compass v0.2 — 調査から開発へ

**iPhone / Windows / Mac のブラウザで使える、プロジェクト管理付きの市場調査PWA。**

## 使い始める

### Windows（オフラインのUIだけ先に試す）

ZIPを展開して `index.html` をEdge / Chromeで開く。外部の公開API検索はブラウザの制限で失敗する場合がある。より安定して利用するなら下記のHTTPS公開を推奨。

### iPhone（おすすめ）

一度GitHub Pages / 静的ホスティングサービスにこのフォルダの内容を公開し、SafariでHTTPS URLを開く。iOSの共有メニュー → 「ホーム画面に追加」でPWA風に使える。**公開作業をしない状態でChatGPTのファイルURLをタップしても、iOS上で常に動作するわけではない。**

GitHub Pagesの場合：

1. GitHubにリポジトリを作成（例：`market-compass`、公開リポジトリ）。
2. `index.html`、`app.js`、`extensions.js`、`style.css`、`sw.js`、`manifest.webmanifest`、`assets/` の中身をリポジトリのルートへ配置・コミット。
3. `Settings` → `Pages` → `Deploy from a branch` → `main` / `(root)` → `Save`。
4. 表示されたHTTPS URLをiPhoneから開く。

**公開リポジトリにAPIキーや私的なレビュー・調査バックアップをコミットしないこと。** アプリの調査結果は端末のブラウザ内に保存され、iPhoneとWindows間では自動同期しない。必要なら「全体保存」→「復元」で移動。

## 追加された機能

- 市場分析、競合、ユーザーレビュー、価格・収益、差別化、出典、開発仕様、Codex引き継ぎを分けた9画面。
- **複数プロジェクト**：新規・複製・切り替え・削除。ブラウザのIndexedDBに保存、localStorageで小規模バックアップ。
- **市場・需要メモ**：検証すべき項目を区別し、推計未実施の項目は未確認のまま表示。
- **収支試算**：月間利用者、有料転換率、単価、手数料、変動費、固定費を変更。入力された仮定だけで計算。
- **出典・検証ノート**：確認済み・仮説・未確認を分け、URLとメモを追加。
- **Codex引き継ぎZIP**：PRD / CODEX_TASK / AGENTS / RESEARCH_EVIDENCE / README をまとめて生成。追加の依存ライブラリなし。
- 従来のApp Store・GitHub・Hacker News検索、レビューCSV取込、機能優先順位、Markdown PRDを維持。

## Codexへ引き継ぐ

1. 「開発企画書」の内容を整えて、必要な調査を行う。
2. 「Codex引き継ぎ」画面で作業指示を書く。
3. 「Codex引き継ぎZIPを生成」を押し、5ファイルを取得する。
4. GitHubの**開発用リポジトリ**に、実際のソースと一緒にこれらの資料をアップロード。
5. [Codex Cloud](https://chatgpt.com/codex/)でそのリポジトリを選び、`CODEX_TASK.md` の指示を送る。

**v0.2では自動でCodexやWorkを起動しない。** 自動実行を実装するには認証・リポジトリ接続・安全な実行基盤・利用枠/費用上限の制御が必要。

## 旧版からのデータ引き継ぎ

**同じURL・同じブラウザ環境でv0.1をv0.2に置き換えれば**、以前の保存データを最初のプロジェクトに取り込む処理がある。別のURLや端末へ移す場合はv0.1でJSONを書き出し、v0.2の「利用者の声」→「CSV/JSON取込」でv0.1バックアップを復元するか、v0.2開始前に同じURLでアップデートする。

## 結果の限界と注意

- v0.2の公開API接続先は App Store（アプリ情報・初期購入価格・平均評価件数）、GitHub（公開リポジトリ）、Hacker News（一般議論）。**市場規模の推計や課金意向の直接測定ではない。**
- 個別のApp Storeレビュー全文を自動収集する機能、Google Play価格、全Webのクローリング、AIによる自動分析、最新のサブスク価格、クラウド同期はまだ未実装。
- 説明文から競合の機能を推測するため、機能の存在・非存在を断定できない。
- 価格画面の利用者数・会員率・変動費等は自由に設定する**仮定**。自動調査された実測値ではない。
- 画面内のデータは端末内。調査キーワードは公開APIに送信するが、リポジトリへの送信やAI APIへの送信はしない。
- ネット未接続時、取得済みUIの表示はPWAキャッシュ経由で行える場合があるが、**公開APIから新規検索はできない**。

## ソースの構造

- `index.html` / `style.css`: 画面とレスポンシブデザイン
- `app.js`: 公開API、競合・レビュー分析、基本画面とPRD
- `extensions.js`: 複数企画、採算、出典ノート、Codex引き継ぎZIP
- `sw.js`: PWAキャッシュ
- `assets/`: アイコン
- `.github/workflows/validate.yml`: JavaScript構文・重要ファイルの基本チェック
- `AGENTS.md`: 今後Codexがこのアプリ自体を開発する際のルール

v0.2ではブラウザUI操作・ZIP生成のスモークテストに成功。実際の公開APIからのライブ取得、iPhoneの実機PWA動作、GitHub連携そのものは未検証。

GitHub Pages 公開URL（有効化後）: https://ressentimentjp.github.io/market-compass/
