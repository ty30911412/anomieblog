import React, { useState } from 'react';
import { db } from '../services/firebase';

const AdminUpload: React.FC = () => {
  const [status, setStatus] = useState<string>('等待執行...');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!confirm('確定要將 constants.ts 的文章覆寫至 Firestore 嗎？這可能會覆蓋現有的標題與內文修訂。')) return;
    
    setIsUploading(true);
    setStatus('開始上傳...');
    
    try {
      const batch = db.batch();

      SAMPLE_POSTS.forEach((post) => {
        // 1. 先取得參照
        const docRef = db.collection('posts').doc(post.slug);
        
        // 2. 修正錯誤：batch.set 的第一個參數必須是 docRef，第二個才是資料
        batch.set(docRef, {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          date: post.date,
          tags: post.tags,
          readTime: post.readTime,
          coverImage: post.coverImage,
          initialLikes: post.initialLikes 
        }, { merge: true });
      });

      await batch.commit();
      setStatus(`成功上傳 ${SAMPLE_POSTS.length} 篇文章至 Firestore！`);
    } catch (error: any) {
      console.error(error);
      // 顯示具體錯誤訊息
      setStatus(`上傳失敗: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-serif">資料庫遷移工具</h1>
      <p className="text-gray-600">
        此工具會將 <code className="bg-gray-100 px-2 py-1 rounded">constants.ts</code> 中的 
        {SAMPLE_POSTS.length} 篇文章寫入 Firestore 的 'posts' 集合。
      </p>
      
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
        注意：請確保您的 Firestore Rules 目前設定為允許寫入 (Test Mode)。
      </div>

      <div className="border p-4 rounded bg-gray-50">
        狀態: <span className="font-bold text-ink-900">{status}</span>
      </div>

      <button
        onClick={handleUpload}
        disabled={isUploading}
        className="px-6 py-2 bg-ink-900 text-white rounded hover:bg-ink-800 disabled:opacity-50 transition-colors"
      >
        {isUploading ? '處理中...' : '執行資料遷移'}
      </button>
    </div>
  );
};

export default AdminUpload;