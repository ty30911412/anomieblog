// pages/EditPostPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { BlogPost } from '../types';
import { Save, ArrowLeft, Eye, Edit3, Image as ImageIcon, CheckCircle } from 'lucide-react';
import SEO from '../components/SEO';
import MarkdownRenderer from '../components/MarkdownRenderer';

const EditPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEditMode = !!slug;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    readTime: '5 分鐘',
    coverImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1000',
    initialLikes: 0
  });

  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (!isEditMode || !slug) return;
    const fetchPost = async () => {
      const doc = await db.collection('posts').doc(slug).get();
      if (doc.exists) {
        const data = doc.data() as BlogPost;
        setFormData(data);
        setTagsInput(data.tags.join(', '));
      } else {
        alert('找不到文章');
        navigate('/admin');
      }
      setLoading(false);
    };
    fetchPost();
  }, [slug, isEditMode, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      alert('標題、網址代稱 (Slug) 和內容是必填的');
      return;
    }
    setSaving(true);
    try {
      const finalData = {
        ...formData,
        tags: tagsInput.split(',').map(t => t.trim()).filter(t => t),
        initialLikes: formData.initialLikes || 0
      };
      await db.collection('posts').doc(finalData.slug!).set(finalData, { merge: true });
      alert(isEditMode ? '文章更新成功！' : '文章發布成功！');
      navigate('/admin');
    } catch (error) {
      console.error(error);
      alert('儲存失敗，請檢查網路');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">載入中...</div>;

  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col bg-paper">
      <SEO title={isEditMode ? "編輯文章" : "寫新文章"} />
      
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b border-ink-200 px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-ink-500 hover:text-ink-900 transition-colors p-2 hover:bg-ink-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
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
            {previewMode ? <><Edit3 size={16}/> 編輯</> : <><Eye size={16}/> 預覽</>}
          </button>
          
          {/* 上方快速存檔按鈕 */}
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 lg:px-4 py-6">
        
        {/* Editor Inputs (Left) */}
        <div className={`space-y-6 px-4 lg:px-0 pb-20 ${previewMode ? 'hidden lg:block' : 'block'}`}>
          
          {/* Metadata Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-100 space-y-4">
             <div>
               <label className="block text-sm font-bold text-ink-700 mb-1">文章標題</label>
               <input 
                 type="text" 
                 className="w-full text-2xl font-serif font-bold border-b-2 border-ink-100 py-2 focus:outline-none focus:border-ink-800 bg-transparent placeholder:text-ink-200 transition-colors"
                 placeholder="輸入標題..."
                 value={formData.title}
                 onChange={e => setFormData({...formData, title: e.target.value})}
               />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-500 mb-1 uppercase">URL Slug</label>
                  <input 
                    type="text" 
                    className="w-full text-sm border border-ink-200 rounded p-2 focus:ring-2 focus:ring-ink-800 outline-none bg-ink-50/50"
                    placeholder="ex: my-first-post"
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value})}
                    disabled={isEditMode} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500 mb-1 uppercase">發布日期</label>
                  <input 
                    type="date" 
                    className="w-full text-sm border border-ink-200 rounded p-2 focus:ring-2 focus:ring-ink-800 outline-none"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
             </div>
          </div>

          {/* Details Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-100 space-y-4">
             <div>
               <label className="block text-sm font-bold text-ink-700 mb-1">摘要</label>
               <textarea 
                 rows={3}
                 className="w-full text-sm border border-ink-200 rounded p-2 focus:ring-2 focus:ring-ink-800 outline-none resize-none"
                 placeholder="簡短介紹..."
                 value={formData.excerpt}
                 onChange={e => setFormData({...formData, excerpt: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-sm font-bold text-ink-700 mb-2">封面圖片</label>
               <div className="flex items-start gap-4">
                 <div className="w-24 h-16 bg-ink-100 rounded overflow-hidden shrink-0 border border-ink-200 flex items-center justify-center">
                    {formData.coverImage ? (
                      <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-ink-300" size={24} />
                    )}
                 </div>
                 <div className="flex-1">
                   <input 
                     type="text" 
                     className="w-full text-sm border border-ink-200 rounded p-2 focus:ring-2 focus:ring-ink-800 outline-none mb-1"
                     placeholder="貼上圖片連結..."
                     value={formData.coverImage}
                     onChange={e => setFormData({...formData, coverImage: e.target.value})}
                   />
                 </div>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-bold text-ink-700 mb-1">標籤</label>
                  <input 
                    type="text" 
                    className="w-full text-sm border border-ink-200 rounded p-2 focus:ring-2 focus:ring-ink-800 outline-none"
                    placeholder="社會學, 筆記"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-ink-700 mb-1">閱讀時間</label>
                  <input 
                    type="text" 
                    className="w-full text-sm border border-ink-200 rounded p-2 focus:ring-2 focus:ring-ink-800 outline-none"
                    placeholder="ex: 5 分鐘"
                    value={formData.readTime}
                    onChange={e => setFormData({...formData, readTime: e.target.value})}
                  />
               </div>
             </div>
          </div>

          {/* Markdown Editor */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-100 flex flex-col min-h-[500px]">
             <label className="block text-sm font-bold text-ink-700 mb-2">文章內容 (Markdown)</label>
             <textarea 
               className="w-full flex-1 font-mono text-sm border border-ink-200 rounded p-4 focus:ring-2 focus:ring-ink-800 outline-none leading-relaxed"
               placeholder="# 在此開始寫作..."
               value={formData.content}
               onChange={e => setFormData({...formData, content: e.target.value})}
             />
          </div>

          {/* 🌟 底部超大儲存區塊 🌟 */}
          <div className="bg-ink-50 p-6 rounded-xl border-2 border-ink-200 flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
            <div className="text-ink-600 text-sm">
              <p className="font-bold flex items-center gap-2"><CheckCircle size={16}/> 準備好發布了嗎？</p>
              <p>確認上方內容無誤後，點擊右側按鈕進行更新。</p>
            </div>
            {/* 修復重點：
                將 bg-ink-900 改為強制 Hex 色碼 bg-[#26221f]，並確保 text-white。
                這樣能保證按鈕是深色背景，白色文字清晰可見。
            */}
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#26221f] text-white rounded-lg hover:bg-[#36312d] disabled:opacity-50 transition-all shadow-lg hover:shadow-xl text-lg font-bold tracking-wide"
            >
              <Save size={24} /> 
              {saving ? '處理中...' : (isEditMode ? '確認更新文章' : '確認發布文章')}
            </button>
          </div>

        </div>

        {/* Live Preview (Right) */}
        <div className={`
          bg-paper border-l border-ink-200 pl-0 lg:pl-8 overflow-y-auto pb-20 px-4 lg:px-0
          ${!previewMode ? 'hidden lg:block' : 'block'}
        `}>
          <div className="sticky top-0 bg-paper/95 backdrop-blur py-2 mb-4 z-10">
             <h2 className="text-xs font-bold text-ink-400 uppercase tracking-widest border-b border-ink-100 pb-2">
               Live Preview
             </h2>
          </div>
          
          <article className="max-w-none pb-20">
            <h1 className="text-4xl font-serif font-bold text-ink-900 leading-tight mb-8 mt-4">
              {formData.title || '文章標題'}
            </h1>
            <MarkdownRenderer content={formData.content || ''} />
          </article>
        </div>

      </div>
    </div>
  );
};

export default EditPostPage;
