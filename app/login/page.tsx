'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/admin')
    } catch {
      setError('登入失敗，請檢查您的帳號密碼。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-ink-900 mb-3 tracking-tight">
            Liam's note
          </h1>
          <p className="text-ink-500 font-sans text-sm tracking-wide uppercase">Admin Portal</p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-ink-100/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-ink-900" />

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1.5 ml-1">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300 group-focus-within:text-amber-700 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-ink-50/50 border border-ink-200 rounded-lg outline-none focus:ring-2 focus:ring-ink-800 focus:border-transparent transition-all font-sans text-ink-900 placeholder:text-ink-300"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1.5 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300 group-focus-within:text-amber-700 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-ink-50/50 border border-ink-200 rounded-lg outline-none focus:ring-2 focus:ring-ink-800 focus:border-transparent transition-all font-sans text-ink-900 placeholder:text-ink-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#26221f] hover:bg-[#36312d] text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-8 group"
            >
              {loading ? '驗證中...' : (
                <>
                  登入後台
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-ink-400 hover:text-ink-800 transition-colors font-medium">
            ← 返回首頁
          </Link>
        </div>
      </div>
    </div>
  )
}
