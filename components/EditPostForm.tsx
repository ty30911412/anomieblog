'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BlogPost } from '@/types'
import { Save, ArrowLeft, Eye, Edit3 } from 'lucide-react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import Link from 'next/link'

interface EditPostFormProps {
  slug?: string  // 若有 slug 則為編輯模式，否則為新增模式
}

export default function EditPostForm({ slug }: EditPostFormProps) {
  const router = useRouter()
  const isEditMode = !!slug
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [tagsInput, setTagsInput] = useState('')

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    readTime: '5 分鐘',
    coverImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1000',
    initialLikes: 0,
  })

  useEffect(() => {
    if (!isEditMode || !slug) return
    const fetchPost = async () => {
      const snap = await getDoc(doc(db, 'posts', slug))
      if (snap.exists()) {
        const data = snap.data() as BlogPost
        setFormData(data)
        setTagsInput(data.tags.join(', '))
      } else {
        alert('找不到文章')
        router.push('/admin')
      }
      setLoading(false)
    }
    fetchPost()
  }, [slug, isEditMode, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.slug || !formData.content) {
      alert('標題、網址代稱 (Slug) 和內容是必填的')
      return
    }
    setSaving(true)
    try {
      const finalData = {
        ...formData,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        initialLikes: formData.initialLikes || 0,
      }
      await setDoc(doc(db, 'posts', finalData.slug!), finalData, { merge: true })
      alert(isEditMode ? '文章更新成功！' : '文章發布成功！')
      router.push('/admin')
    } catch {
      alert('儲存失敗，請檢查網路')
    } finally {
      setSaving(false)
    }
  }

  const update = (field: keyof BlogPost, value: string | number) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      // 輸入內容時，自動計算閱讀時間
      if (field === 'content' && typeof value === 'string') {
        const chineseChars = (value.match(/[一-鿿]/g) || []).length
        const englishWords = (value.replace(/[一-鿿]/g, '').match(/\b\w+\b/g) || []).length
        // 中文 400 字/分鐘，英文 200 字/分鐘
        const minutes = Math.ceil(chineseChars / 400 + englishWords / 200)
        next.readTime = `${Math.max(1, minutes)} 分鐘`
      }
      return next
    })
  }

  if (loading) return <div className="p-10 text-center text-ink-500 font-serif">載入中...</div>

  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col bg-paper">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b border-ink-200 px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-ink-500 hover:text-ink-900 transition-colors p-2 hover:bg-ink-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-serif font-bold text-ink-900 hidden md:block">
            {isEditMode ? '編輯模式' : '新增文章'}
          </h1>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex lg:hidden items-center gap-2 px-3 py-2 border border-ink-200 rounded hover:bg-ink-50 text-ink-600 text-sm font-bold"
          >
            {previewMode ? <><Edit3 size={16} /> 編輯</> : <><Eye size={16} /> 預覽</>}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-ink-100 text-ink-600 border border-ink-200 rounded hover:bg-ink-200 hover:text-ink-900 disabled:opacity-50 transition-colors text-sm font-bold"
          >
            <Save size={16} />
            <span className="hidden sm:inline">快速存檔</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 lg:px-4 py-6">
        {/* 左側：編輯欄 */}
        <div className={`space-y-6 px-4 lg:px-0 pb-20 ${previewMode ? 'hidden lg:block' : 'block'}`}>
          {/* Metadata 卡片 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-100 space-y-4">
            <div>
              <label className="block text-sm font-bold text-ink-700 mb-1">文章標題</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-ink-800 focus:border-transparent outline-none font-serif text-ink-900 text-lg"
                placeholder="輸入引人入勝的標題..."
                value={formData.title || ''}
                onChange={(e) => update('title', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-ink-700 mb-1">網址代稱 (Slug)</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-ink-800 focus:border-transparent outline-none font-sans text-ink-700 text-sm"
                placeholder="url-friendly-slug"
                value={formData.slug || ''}
                onChange={(e) => update('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                disabled={isEditMode}
              />
              {isEditMode && <p className="text-xs text-ink-400 mt-1">編輯模式下 Slug 無法修改</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-ink-700 mb-1">發布日期</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-ink-800 outline-none font-sans text-ink-700 text-sm"
                  value={formData.date || ''}
                  onChange={(e) => update('date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink-700 mb-1">閱讀時間</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-ink-800 outline-none font-sans text-ink-700 text-sm"
                  placeholder="例：8 分鐘"
                  value={formData.readTime || ''}
                  onChange={(e) => update('readTime', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-ink-700 mb-1">封面圖片 URL</label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-ink-800 outline-none font-sans text-ink-700 text-sm"
                placeholder="https://..."
                value={formData.coverImage || ''}
                onChange={(e) => update('coverImage', e.target.value)}
              />
              {formData.coverImage && (
                <img src={formData.coverImage} alt="封面預覽" className="mt-2 w-full h-32 object-cover rounded-lg border border-ink-100" />
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-ink-700 mb-1">標籤（逗號分隔）</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-ink-800 outline-none font-sans text-ink-700 text-sm"
                placeholder="社會學, 文化, 理論"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-ink-700 mb-1">文章摘要</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-ink-800 outline-none font-serif text-ink-700 text-sm resize-none"
                placeholder="簡短描述這篇文章的核心..."
                value={formData.excerpt || ''}
                onChange={(e) => update('excerpt', e.target.value)}
              />
            </div>
          </div>

          {/* Markdown 編輯區 */}
          <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
            <div className="px-4 py-3 bg-ink-50 border-b border-ink-100 flex items-center gap-2">
              <Edit3 size={16} className="text-ink-400" />
              <span className="text-sm font-bold text-ink-600">Markdown 內容</span>
            </div>
            <textarea
              rows={30}
              className="w-full px-4 py-4 outline-none font-mono text-ink-700 text-sm resize-none leading-relaxed"
              placeholder="## 開始撰寫你的文章...&#10;&#10;支援 **粗體**、*斜體*、[連結](url)、圖片等 Markdown 語法。"
              value={formData.content || ''}
              onChange={(e) => update('content', e.target.value)}
            />
          </div>

          {/* 儲存按鈕 */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#26221f] text-white rounded-xl font-bold text-lg hover:bg-[#36312d] transition-colors shadow-lg hover:shadow-xl disabled:opacity-70"
          >
            <Save size={20} />
            {saving ? '儲存中...' : isEditMode ? '更新文章' : '發布文章'}
          </button>
        </div>

        {/* 右側：即時預覽 */}
        <div className={`bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden h-fit sticky top-20 ${previewMode ? 'block' : 'hidden lg:block'}`}>
          <div className="px-4 py-3 bg-ink-50 border-b border-ink-100 flex items-center gap-2">
            <Eye size={16} className="text-ink-400" />
            <span className="text-sm font-bold text-ink-600">即時預覽</span>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {formData.title && (
              <h1 className="text-3xl font-serif font-bold text-ink-900 mb-6 leading-tight">{formData.title}</h1>
            )}
            {formData.content ? (
              <MarkdownRenderer content={formData.content} />
            ) : (
              <p className="text-ink-300 italic font-serif">開始撰寫，預覽會即時更新...</p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
