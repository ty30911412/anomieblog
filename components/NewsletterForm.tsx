'use client'

import { useState } from 'react'
import { Mail, ArrowRight, CheckCircle } from 'lucide-react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage('訂閱成功！感謝你的支持，新文章發布時將會通知你。')
        setEmail('')
      } else {
        throw new Error(data.error || '訂閱失敗')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : '訂閱失敗，請稍後再試。')
    }
  }

  return (
    <section className="max-w-2xl mx-auto text-center space-y-6 py-8">
      <div className="inline-flex p-3 rounded-full bg-amber-50 border border-amber-100 mb-2">
        <Mail size={24} className="text-amber-700" />
      </div>
      <h2 className="text-2xl md:text-3xl font-serif font-bold text-ink-900">
        訂閱電子報
      </h2>
      <p className="text-ink-500 font-serif leading-relaxed">
        每當有新文章發布，我會寄信通知你。不定期更新，絕不濫發廣告。
      </p>

      {status === 'success' ? (
        <div className="flex items-center justify-center gap-3 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl py-4 px-6">
          <CheckCircle size={20} />
          <span className="font-bold font-sans text-sm">{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="你的電子郵件地址"
            className="flex-1 px-4 py-3 border border-ink-200 rounded-xl outline-none focus:ring-2 focus:ring-ink-800 focus:border-transparent font-sans text-ink-900 placeholder:text-ink-300 bg-white"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-ink-900 text-white rounded-xl font-bold hover:bg-ink-700 transition-colors disabled:opacity-70 whitespace-nowrap group"
          >
            {status === 'loading' ? '訂閱中...' : (
              <>
                訂閱
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="text-red-500 text-sm font-sans">{message}</p>
      )}

      <p className="text-xs text-ink-300 font-sans">
        你可以隨時取消訂閱。
      </p>
    </section>
  )
}
