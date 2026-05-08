// pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import SEO from '../components/SEO';
import { db } from '../services/firebase';
import { BlogPost } from '../types';

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const querySnapshot = await db.collection('posts').get();
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BlogPost[];
        
        // 依照日期排序 (新到舊)
        fetchedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 分離出「置頂文章」(最新的一篇) 與「近期文章」
  const [featuredPost, ...recentPosts] = posts;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-ink-400 font-serif animate-pulse tracking-widest">正在從雲端載入文章...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-20">
      <SEO title="首頁" /> 
      
      {/* Intro Text */}
      <div className="prose prose-stone max-w-3xl">
        <p className="text-xl md:text-2xl font-serif leading-relaxed text-ink-700 italic opacity-80">
          「Economics is all about how people make choices; sociology is all about why they don't have any choices to make.」
        </p>
      </div>

      {/* Featured Post (Hero Section: 圖片與卡片交疊設計) */}
      {featuredPost && (
        <section className="group relative grid grid-cols-1 lg:grid-cols-12 lg:gap-0 gap-8 items-center">
          {/* 圖片區域：佔據左側大部分 (1-10) */}
          <Link 
            to={`/post/${featuredPost.slug}`} 
            className="lg:col-start-1 lg:col-end-10 lg:row-start-1 w-full h-full overflow-hidden rounded-2xl block relative aspect-[16/9] lg:aspect-[16/10] shadow-md z-10"
          >
             <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/10 transition-colors duration-500 z-10" />
             <img 
                src={featuredPost.coverImage} 
                alt={featuredPost.title}
                className="w-full h-full object-cover transform transition-transform duration-1000 ease-out group-hover:scale-105"
              />
          </Link>

          {/* 文字卡片區域：懸浮於右側 (8-13)，形成交疊效果 */}
          <div className="lg:col-start-8 lg:col-end-13 lg:row-start-1 flex flex-col justify-center space-y-6 lg:p-12 p-6 rounded-2xl z-20 transition-all duration-700 ease-out lg:group-hover:-translate-x-4 bg-white/80 group-hover:bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl shadow-ink-900/10">
            <div className="flex items-center gap-3 text-sm font-sans text-ink-600 font-medium transition-colors duration-300 group-hover:text-amber-700">
              <span>{featuredPost.date}</span>
              <span className="w-1 h-1 bg-ink-400 rounded-full transition-colors duration-300 group-hover:bg-amber-700"></span>
              <span>{featuredPost.readTime}</span>
            </div>

            <Link to={`/post/${featuredPost.slug}`} className="block space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink-900 leading-tight transition-colors duration-300 group-hover:text-amber-900 drop-shadow-sm">
                {featuredPost.title}
              </h2>
              <p className="text-ink-600 font-serif leading-relaxed text-lg line-clamp-4 transition-colors duration-500 group-hover:text-ink-900">
                {featuredPost.excerpt}
              </p>
            </Link>

            <div className="pt-4 flex items-center gap-3 flex-wrap">
               {featuredPost.tags.map(tag => (
                  <span key={tag} className="text-xs font-sans text-ink-600 bg-white/50 border border-white/40 px-3 py-1.5 rounded-md transition-colors hover:bg-white hover:text-ink-900 cursor-default">
                    #{tag}
                  </span>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Divider */}
      <div className="w-full h-px bg-ink-200/60" />

      {/* Recent Posts (三欄式排列) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
        {recentPosts.map((post) => (
          <article key={post.id} className="group flex flex-col space-y-5 cursor-pointer">
            <Link to={`/post/${post.slug}`} className="block overflow-hidden rounded-xl aspect-[4/3] relative shadow-sm border border-ink-100/50">
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 z-10" />
              <img 
                src={post.coverImage} 
                alt={post.title}
                className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-110"
              />
            </Link>

            <div className="space-y-3 transform transition-transform duration-500 ease-out group-hover:translate-x-2">
              <div className="flex items-center gap-3 text-xs font-sans text-ink-400 font-medium tracking-wide transition-colors duration-300 group-hover:text-amber-700">
                <span>{post.date}</span>
                <span className="w-1 h-1 bg-ink-300 rounded-full transition-colors duration-300 group-hover:bg-amber-700"></span>
                <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime}</span>
              </div>
              
              <Link to={`/post/${post.slug}`} className="block space-y-2">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-ink-900 leading-snug transition-colors duration-300 group-hover:text-amber-800">
                  {post.title}
                </h2>
                <p className="text-ink-400 font-serif leading-relaxed text-sm line-clamp-3 transition-colors duration-500 group-hover:text-ink-700">
                  {post.excerpt}
                </p>
              </Link>

              <div className="flex items-center justify-between pt-2">
                 <div className="flex gap-2">
                   {post.tags.slice(0, 2).map(tag => (
                     <span key={tag} className="text-xs font-sans text-ink-400 bg-ink-100/50 px-2 py-1 rounded hover:bg-ink-200 transition-colors">
                       #{tag}
                     </span>
                   ))}
                 </div>
                 <Link to={`/post/${post.slug}`} className="text-ink-300 hover:text-ink-800 transition-colors">
                    <ArrowRight size={18} className="transform transition-transform duration-300 group-hover:translate-x-1" />
                 </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
      
      {/* 空狀態處理 */}
      {posts.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-ink-400 font-serif">目前還沒有文章，請至後台新增。</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
