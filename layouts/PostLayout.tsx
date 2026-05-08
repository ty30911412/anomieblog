import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

const PostLayout: React.FC = () => {
  return (
    <>
      {/* 文章頁面：開啟透明模式！且不預留頂部空間，讓大圖能頂到最上面 */}
      <Header transparentMode={true} />
      <main> 
        <Outlet />
      </main>
    </>
  );
};

export default PostLayout;