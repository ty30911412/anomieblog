// pages/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { BlogPost } from '../types';
import { Edit, Trash2, Plus, FileText } from 'lucide-react';
import SEO from '../components/SEO';

const AdminDashboard: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = db.collection('posts').onSnapshot(snapshot => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];
      
      // 按日期降序排列
      fetchedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPosts(fetchedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (slug: string) => {
    if (window.confirm('確定要刪除這篇文章嗎？此動作無法復原。')) {
      try {
        await db.collection('posts').doc(slug).delete();
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("刪除失敗");
      }
    }
  };

  const getStatus = (postDate: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (postDate > todayStr) {
      return { text: '排程中', className: 'bg-amber-100 text-amber-800' };
    }
    return { text: '已發布', className: 'bg-ink-100 text-ink-600' };
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink-500 font-serif">載入中...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <SEO title="管理後台" />
      
      {/* 標題與新增按鈕 */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink-900 mb-2">文章管理</h1>
          <p className="text-ink-500 font-sans">管理您的所有發布內容。</p>
        </div>
        
        {/* 🌟 修復重點：強制指定深色背景 bg-[#26221f] 🌟 */}
        <Link 
          to="/admin/new" 
          className="flex items-center gap-2 px-5 py-2.5 bg-[#26221f] text-white rounded-lg hover:bg-[#36312d] transition-colors font-bold shadow-md hover:shadow-lg"
        >
          <Plus size={18} />
          <span>寫新文章</span>
        </Link>
      </div>

      {/* 文章列表 */}
      <div className="grid gap-4">
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-ink-100 border-dashed">
            <div className="inline-flex p-4 rounded-full bg-ink-50 text-ink-300 mb-4">
              <FileText size={48} />
            </div>
            <p className="text-ink-500 font-bold text-lg">目前沒有文章</p>
            <Link to="/admin/new" className="text-amber-700 font-bold hover:underline mt-2 inline-block">立即新增</Link>
          </div>
        ) : (
          posts.map((post) => {
            const status = getStatus(post.date);
            return (
              <div key={post.slug} className="group bg-white p-6 rounded-xl border border-ink-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                
                {/* 左側：標題與資訊 */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-serif font-bold text-ink-900 mb-2 truncate group-hover:text-amber-800 transition-colors">
                    {post.title}
                  </h2>
                  <div className="flex items-center flex-wrap gap-3 text-sm font-sans">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${status.className}`}>
                      {status.text}
                    </span>
                    <span className="text-ink-400">·</span>
                    <span className="text-ink-500 font-medium">{post.date}</span>
                    <span className="text-ink-400">·</span>
                    <span className="text-ink-500">{post.readTime}</span>
                  </div>
                </div>

                {/* 右側：操作按鈕 */}
                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-ink-100">
                  <Link 
                    to={`/admin/edit/${post.slug}`} 
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-ink-600 hover:text-ink-900 hover:bg-ink-50 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                    編輯
                  </Link>
                  <button 
                    onClick={() => handleDelete(post.slug!)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    刪除
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
