import { NextRequest, NextResponse } from 'next/server'

// 使用 Buttondown API（免費方案，https://buttondown.email）
// 也可以替換成任何其他電子報服務的 API
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: '請輸入有效的電子郵件地址' }, { status: 400 })
    }

    const apiKey = process.env.BUTTONDOWN_API_KEY

    // 如果尚未設定 API Key，回傳模擬成功（開發用）
    if (!apiKey) {
      console.log('[Newsletter] 尚未設定 BUTTONDOWN_API_KEY，模擬訂閱成功:', email)
      return NextResponse.json({ message: '訂閱成功（開發模式）' })
    }

    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (response.status === 201) {
      return NextResponse.json({ message: '訂閱成功！' })
    }

    if (response.status === 400) {
      const data = await response.json()
      // 常見錯誤：此信箱已訂閱
      if (data.email?.includes('already a subscriber')) {
        return NextResponse.json({ error: '此電子郵件已訂閱過了。' }, { status: 400 })
      }
      return NextResponse.json({ error: '訂閱失敗，請確認信箱格式。' }, { status: 400 })
    }

    throw new Error(`Buttondown API 回傳 ${response.status}`)
  } catch (err) {
    console.error('[Newsletter] Error:', err)
    return NextResponse.json({ error: '伺服器錯誤，請稍後再試。' }, { status: 500 })
  }
}
