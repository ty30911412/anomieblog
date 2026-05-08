import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

const DefaultLayout: React.FC = () => {
  return (
    <>
      {/* 普通頁面：不開啟透明模式，並預留頂部空間防止內容被 Header 遮住 */}
      <Header transparentMode={false} />
      <main className="pt-[88px]"> 
        <Outlet />
      </main>
    </>
  );
};

export default DefaultLayout;
