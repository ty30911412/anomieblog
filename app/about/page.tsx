import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '關於我',
  description: "關於 Liam's note 與作者的簡介",
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 pt-32 pb-20 font-serif text-ink-800 animate-fade-in text-lg leading-loose">
      <h1 className="font-serif font-bold text-3xl mb-10 text-ink-900">關於這裡</h1>

      <p className="mb-6">
        你好，歡迎來到 Liam's note。
      </p>

      <p className="mb-6">
        這裡是我的讀書筆記與科普知識分享空間。我喜歡閱讀，也喜歡把讀到的東西轉化成更容易消化的文字——無論是社會學理論、人文思想，還是日常生活中值得細想的現象。
      </p>

      <p className="mb-6">
        知識不該只留在學院的高牆內。我希望用更輕鬆、更像散文的方式，把這些概念帶入生活中。有時候是嚴謹的理論梳理，有時候只是某個下午讀完一本書後的雜感。
      </p>

      <h3 className="font-bold text-2xl mt-12 mb-6 text-ink-900">關於設計</h3>
      <p className="mb-6">
        網站刻意保持米白色的溫暖基調，去除了過多的干擾。在這個資訊過載的時代，希望這裡能提供你一段安靜閱讀的時光。
      </p>

      <h3 className="font-bold text-2xl mt-12 mb-6 text-ink-900">聯絡</h3>
      <p className="mb-6">
        歡迎透過電子郵件與我交流想法：
        <a
          href="mailto:ty30911412@gmail.com"
          className="text-ink-900 font-semibold border-b border-ink-300 hover:border-amber-600 hover:text-amber-800 transition-colors ml-1"
        >
          ty30911412@gmail.com
        </a>
      </p>
    </div>
  )
}
