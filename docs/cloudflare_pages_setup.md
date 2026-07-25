# Cloudflare Pages × GitHub 自動デプロイ設定マニュアル

本書は、Tomato Log（ライフログ PWA）を **Cloudflare Pages** に連携し、コードを `git push` するだけで全自動更新される環境を構築するための完全ガイドです。

---

## 📌 概要・前提条件

- **方式:** Cloudflare Pages (Git Integration)
- **効果:** 人間の手動操作なしで、GitHub への `git push` をトリガーに数秒で自動ビルド・デプロイが完了します。
- **必要環境:** GitHub アカウント、Cloudflare アカウント

---

## 🚀 ステップバイステップ設定手順

### ステップ 1: Cloudflare にログイン & アプリ作成の開始

1. [Cloudflare Dash](https://dash.cloudflare.com/) にログインします。
2. 左側メニューから **「Workers & Pages」** を選択します。
3. 画面右上にある青い **「Create application（アプリケーションの作成）」** ボタンをクリックします。
4. モーダル画面が表示されたら、画面一番下にある以下の青いリンクテキストをクリックします：
   > **`Looking to deploy Pages? Get started`**
   > *(または中央一番上の「Continue with GitHub」をクリック)*

---

### ステップ 2: GitHub 連携とリポジトリの選択

1. **「Connect to GitHub（GitHub に接続）」** をクリックしてアカウント連携を許可します。
2. リポジトリ一覧から本プロジェクトのリポジトリ（例: `takumihomma/tomato-log`）を選択します。
3. **「Begin setup（セットアップの開始）」** をクリックします。

---

### ステップ 3: ビルド設定（Build Settings）の指定

`wrangler.json` に設定を記述しているため、ビルド構成画面（または Build Settings ドロワー）で以下のパラメータを入力します：

| 設定項目 | 入力値 / 選択肢 | 備考 |
| :--- | :--- | :--- |
| **Project name (プロジェクト名)** | `tomato-log` | アプリ識別名 (`https://tomato-log.pages.dev`) |
| **Build command (ビルドコマンド)** | `npm run build` | Vite + TypeScript のコンパイルコマンド |
| **Deploy command (デプロイコマンド)** | `npx wrangler pages deploy ./dist --project-name tomato-log` | **【重要】** Pages専用プロジェクト名指定デプロイ |

> **💡 出力ディレクトリの自動認識:**
> プロジェクト直下の `wrangler.json` に `"pages_build_output_dir": "./dist"` を定義しているため、Cloudflare 側のビルドエンジンが自動的に `./dist` フォルダを静的配信サイトとして読み込み・自動デプロイを行います。

---

### ステップ 4: デプロイの完了と動作確認

1. 設定を入力したら、画面最下部の **「Save and Deploy（保存してデプロイ）」** をクリックします。
2. 初回ビルドが開始され、約30秒でユニークなURL（`https://tomato-log-xxx.pages.dev`）が発行されます。

---

## 🔄 今後の運用方法（全自動デプロイ）

これ以降は、ローカルでコードを修正した際、ターミナルでコミットして Push するだけで手動操作なしに全自動で本番サイトへ反映されます。

```bash
# 1. 変更のコミット
git add .
git commit -m "feat: 機能の追加・修正"

# 2. GitHubへのPush（自動でCloudflareへ反映されます）
git push
```

---

## ❓ トラブルシューティング

- **Q. スマホ画面が古いまま更新されません**
  - A. スマホブラウザのキャッシュ（Service Worker）を更新するため、画面を上にスワイプしてアプリを一度完全終了するか、シークレットモードで開き直してください。コード側にも自動キャッシュパージ機構が組み込まれています。
- **Q. ビルドエラーになります**
  - A. `Build output directory` が `dist` に設定されているか、`Build command` が `npm run build` になっているか「Settings ➔ Builds & deployments」から再確認してください。
