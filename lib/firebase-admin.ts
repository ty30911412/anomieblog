// lib/firebase-admin.ts — 伺服器端 Firebase Admin（Server Components 專用）
// 若 Admin SDK 環境變數未設定，會優雅降級（回傳空資料），不會讓開發伺服器崩潰
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let adminDb: Firestore | null = null

const projectId   = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (projectId && clientEmail && privateKey) {
  try {
    const app = getApps().length === 0
      ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
      : getApps()[0]
    adminDb = getFirestore(app)
  } catch (e) {
    console.error('[Firebase Admin] 初始化失敗，請確認服務帳戶金鑰是否正確：', e)
  }
} else {
  console.warn(
    '[Firebase Admin] 未偵測到 Admin SDK 環境變數。\n' +
    '  請在 .env.local 設定：FIREBASE_PROJECT_ID、FIREBASE_CLIENT_EMAIL、FIREBASE_PRIVATE_KEY\n' +
    '  詳細說明請參考 SETUP.md。目前以空資料運行。'
  )
}

export { adminDb }
