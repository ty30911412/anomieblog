import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? "Liam's note"
  const excerpt = searchParams.get('excerpt') ?? '讀書筆記與科普知識分享，涵蓋社會學、文化、人文科學等主題。'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '64px',
          background: '#fdfbf7',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* 左側裝飾線 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '8px',
            background: '#b45309',
          }}
        />

        {/* 網站名稱 */}
        <div
          style={{
            fontSize: 22,
            color: '#8f887c',
            letterSpacing: '0.15em',
            marginBottom: 24,
            textTransform: 'uppercase',
          }}
        >
          Liam's note
        </div>

        {/* 標題 */}
        <div
          style={{
            fontSize: title.length > 20 ? 52 : 64,
            fontWeight: 900,
            color: '#26221f',
            lineHeight: 1.2,
            marginBottom: 24,
            maxWidth: '900px',
          }}
        >
          {title}
        </div>

        {/* 摘要 */}
        <div
          style={{
            fontSize: 26,
            color: '#70695d',
            lineHeight: 1.6,
            maxWidth: '850px',
            display: '-webkit-box',
            overflow: 'hidden',
          }}
        >
          {excerpt.slice(0, 80)}{excerpt.length > 80 ? '...' : ''}
        </div>

        {/* 底部橫線 */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 64,
            fontSize: 18,
            color: '#b0aba0',
          }}
        >
          sociologysolitude.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
