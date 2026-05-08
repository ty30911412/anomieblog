# 阿諾米 anomie — 設定與部署指南

## 目錄

1. [技術架構](#技術架構)
2. [本地開發設定](#本地開發設定)
3. [Firebase Admin SDK 設定](#firebase-admin-sdk-設定)
4. [Giscus 留言設定](#giscus-留言設定)
5. [Buttondown 電子報設定](#buttondown-電子報設定)
6. [部署到 Vercel](#部署到-vercel)

---

## 技術架構

| 層面 | 技術 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 資料庫 | Firebase Firestore |
| 身份驗證 | Firebase Auth |
| CSS | Tailwind CSS |
| 留言 | Giscus (GitHub Discussions) |
| 電子報 | Buttondown |
| 部署 | Vercel |

---

## 本地開發設定

### 步驟一：安裝依賴

```bash
npm install
```

### 步驟二：建立環境變數檔案

```bash
cp .env.local.example .env.local
```

然後按照以下說明填入各個環境變數。

### 步驟三：填入 Firebase 客戶端設定

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇你的專案 → 點擊齒輪圖示 → **專案設定**
3. 往下滑到「你的應用程式」區塊
4. 複製 `firebaseConfig` 中的各個值，填入 `.env.local`：

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 步驟四：啟動開發伺服器

```bash
npm run dev
```

瀏覽器開啟 http://localhost:3000

---

## Firebase Admin SDK 設定

Admin SDK 用於伺服器端（SSR）讀取 Firestore，讓 Google 能正確索引你的文章內容。

### 取得服務帳戶金鑰

1. Firebase Console → **專案設定** → 頂部點擊 **「服務帳戶」** 分頁
2. 點擊「**產生新的私密金鑰**」按鈕
3. 下載 JSON 檔案（妥善保管，不要 commit 到 Git！）

### 填入環境變數

打開下載的 JSON 檔案，找到對應欄位填入 `.env.local`：

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIB...\n-----END PRIVATE KEY-----\n"
```

> **重要**：`FIREBASE_PRIVATE_KEY` 的值必須用雙引號包起來，且換行符保持 `\n` 格式（不要真的換行）。

---

## Giscus 留言設定

Giscus 使用 GitHub Discussions 作為留言後端，完全免費。

### 前置條件

- 你的 GitHub repo 必須是 **Public**
- 在 repo 的 Settings → Features → 勾選 **Discussions**

### 設定步驟

1. 前往 [giscus.app](https://giscus.app)
2. 在「Repository」欄位填入你的 repo（格式：`username/repo-name`）
3. 在「Page ↔️ Discussions Mapping」選擇 **pathname**
4. 在「Discussion Category」選擇 **Announcements**
5. 頁面下方會自動產生你的設定值，複製填入 `.env.local`：

```
NEXT_PUBLIC_GISCUS_REPO=your-github-username/your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_kgDO...
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDO...
```

---

## Buttondown 電子報設定

[Buttondown](https://buttondown.email) 免費方案支援最多 100 位訂閱者，非常適合起步。

### 設定步驟

1. 前往 [buttondown.email](https://buttondown.email) 註冊免費帳號
2. 登入後，前往 **Settings → API**
3. 複製你的 API Key 填入 `.env.local`：

```
BUTTONDOWN_API_KEY=your-api-key-here
```

> 如果你之後訂閱者超過 100 人，可以考慮升級方案或換用 [Resend](https://resend.com)、[Mailchimp](https://mailchimp.com) 等服務。

---

## 部署到 Vercel

### 方法一：連結 GitHub（推薦）

1. 將你的專案推送到 GitHub：
   ```bash
   git add .
   git commit -m "migrate to Next.js"
   git push origin main
   ```

2. 前往 [vercel.com](https://vercel.com) → **New Project**
3. 選擇你的 GitHub repo → 點擊 **Deploy**
4. 部署完成後，前往專案的 **Settings → Environment Variables**
5. 把 `.env.local` 中的所有變數逐一新增進去

### 方法二：Vercel CLI

```bash
npm i -g vercel
vercel
# 按照提示操作，最後執行：
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# ... 重複新增所有環境變數
vercel --prod
```

### 綁定自訂網域

1. 購買網域（推薦：[Namecheap](https://namecheap.com) 或 [Cloudflare Registrar](https://cloudflare.com)）
2. Vercel 專案 → Settings → **Domains** → 新增你的網域
3. 按照 Vercel 的指示，到你的網域商後台新增 DNS 記錄（通常是 A record 或 CNAME）
4. 等待 DNS 生效（通常 10 分鐘內完成）

---

## 新增文章

1. 瀏覽器開啟 `https://你的網址/login`
2. 使用 Firebase Auth 設定的管理員帳號登入
3. 點擊「寫新文章」，在左側填寫內容，右側即時預覽
4. 點擊「發布文章」，文章立即出現在首頁

> Firebase Auth 管理員帳號設定：Firebase Console → Authentication → Users → 新增使用者

---

## 常見問題

**Q：本地開發時留言區顯示「請設定 Giscus」的提示？**  
A：正常現象。Giscus 只有在填入環境變數後才會啟用。開發時可以忽略。

**Q：電子報訂閱顯示「訂閱成功（開發模式）」？**  
A：正常現象。未設定 `BUTTONDOWN_API_KEY` 時，API 會模擬成功以便測試。

**Q：Vercel 部署後文章沒有出現？**  
A：確認 Firebase Admin SDK 的三個環境變數（`FIREBASE_PROJECT_ID`、`FIREBASE_CLIENT_EMAIL`、`FIREBASE_PRIVATE_KEY`）已正確填入 Vercel 的 Environment Variables。
