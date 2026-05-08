// pages/PostPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { BlogPost } from '../types';
import { Calendar, Clock, Tag, ThumbsUp } from 'lucide-react';
import SEO from '../components/SEO';
import MarkdownRenderer from '../components/MarkdownRenderer';

const PostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const doc = await db.collection('posts').doc(slug).get();
        if (doc.exists) {
          const data = doc.data() as BlogPost;
          setPost(data);
          setLikes(data.likes || data.initialLikes || 0);
          
          const storageKey = `liked_${slug}`;
          const alreadyLiked = localStorage.getItem(storageKey);
          if (alreadyLiked === 'true') {
            setHasLiked(true);
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPost();
  }, [slug, navigate]);

  const handleLike = async () => {
    if (hasLiked || !slug) return;
    
    const newLikes = likes + 1;
    setLikes(newLikes);
    setHasLiked(true);
    localStorage.setItem(`liked_${slug}`, 'true');

    try {
      await db.collection('posts').doc(slug).update({ likes: newLikes });
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink-500 font-serif tracking-widest">載入中...</div>;
  }
  if (!post) return null;

  return (
    <article className="overflow-x-hidden">
      <SEO title={post.title} description={post.excerpt} image={post.coverImage} type="article" />

      {/* 🌟 Hero Section (修正縫隙問題) 🌟 */}
      {/* 1. w-[100vw]: 強制寬度為視窗寬度
          2. left-1/2 -translate-x-1/2: 使用 Transform 進行絕對置中。
             這比 margin 計算更精準，能確保圖片中心對齊螢幕中心，且兩側不會有計算誤差造成的白邊。
          3. ml-0: 移除之前的 margin 計算
      */}
      <div className="relative h-[65vh] min-h-[400px] w-[100vw] left-1/2 -translate-x-1/2 ml-0 flex items-center justify-center overflow-hidden">
        {post.coverImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center z-0 scale-105"
            style={{ backgroundImage: `url(${post.coverImage})`, transition: 'transform 10s ease-out' }}
          ></div>
        )}
        <div className="absolute inset-0 bg-ink-900/40 z-10"></div>

        <div className="relative z-20 max-w-4xl mx-auto px-6 text-center text-white flex flex-col items-center">
           <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-sans mb-6 opacity-90 tracking-wider uppercase">
             <div className="flex items-center gap-1.5"><Calendar size={14} /><span>{post.date}</span></div>
             <div className="flex items-center gap-1.5"><Clock size={14} /><span>{post.readTime}</span></div>
           </div>
           <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight tracking-tight drop-shadow-sm">
             {post.title}
           </h1>
        </div>
      </div>

      {/* 🌟 主要內容區塊 (修正間距問題) 🌟 */}
      {/* 1. 移除了 -mt-8 (原本是為了卡片重疊效果，現在背景透明不需要了)
          2. 改用 mt-16 md:mt-24 (給予上方充足的 margin)
          3. 移除了 pt-24 (不需要 padding 了，用 margin 控制距離更乾淨)
      */}
      <div className="max-w-3xl mx-auto px-6 pb-20 md:pb-32 mt-16 md:mt-24 relative z-30">
        
        {/* Markdown 內文 */}
        <div className="mb-16">
          <MarkdownRenderer content={post.content} />
        </div>

        {/* 底部互動區 */}
        <div className="border-t border-ink-200/60 pt-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {post.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-ink-100 text-ink-600 rounded-full text-xs font-bold hover:bg-ink-200 transition-colors cursor-default">
                <Tag size={12} />{tag}
              </span>
            ))}
          </div>
          <button 
            onClick={handleLike}
            disabled={hasLiked}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-bold shadow-sm hover:shadow-md ${hasLiked ? 'bg-amber-100 text-amber-700 border border-amber-200 cursor-default' : 'bg-white text-ink-600 border border-ink-200 hover:border-amber-300 hover:text-amber-600'}`}
          >
            <ThumbsUp size={18} className={hasLiked ? "fill-current" : ""} />
            <span>{hasLiked ? '已喜歡' : '喜歡這篇文章'}</span>
            <span className="ml-1 opacity-80">({likes})</span>
          </button>
        </div>

      </div>
    </article>
  );
};

export default PostPage;
