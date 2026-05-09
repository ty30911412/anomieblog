import Link from 'next/link'
import { Search, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {/* 數字 */}
      <p className="font-serif text-[120px] md:text-[180px] font-bold text-ink-100 leading-none select-none">
        404
      </p>

      {/* 說明 */}
      <div className="-mt-4 mb-10">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900 mb-3">
          找不到這個頁面
        </h1>
        <p className="text-ink-500 text-sm max-w-sm mx-auto leading-relaxed">
          這篇文章可能已經移除、網址打錯了，或者它根本還不存在。
        </p>
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-ink-900 text-white rounded-full font-bold text-sm hover:bg-ink-700 transition-colors"
        >
          <Home size={16} /> 回首頁
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-2 px-6 py-3 bg-white border border-ink-200 text-ink-700 rounded-full font-bold text-sm hover:border-amber-300 hover:text-amber-700 transition-colors"
        >
          <Search size={16} /> 搜尋文章
        </Link>
        <button
          onClick={() => history.back()}
          className="flex items-center gap-2 px-6 py-3 text-ink-400 font-bold text-sm hover:text-ink-700 transition-colors"
        >
          <ArrowLeft size={16} /> 返回上一頁
        </button>
      </div>
    </div>
  )
}
