// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import AdminRoute from './components/AdminRoute';

// 引入新的 Layouts
import DefaultLayout from './layouts/DefaultLayout';
import PostLayout from './layouts/PostLayout';

// Pages
import HomePage from './pages/HomePage';
import PostPage from './pages/PostPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import EditPostPage from './pages/EditPostPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <div className="min-h-screen bg-paper text-ink-800 font-sans selection:bg-amber-200 selection:text-amber-900">
          <Routes>
            
            {/* 1. 使用「透明 Header 佈局」的路由 */}
            <Route element={<PostLayout />}>
              <Route path="/post/:slug" element={<PostPage />} />
            </Route>

            {/* 2. 使用「預設 Header 佈局」的路由 (其他所有頁面) */}
            <Route element={<DefaultLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={
                <AdminRoute>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/new" element={<EditPostPage />} />
                    <Route path="/edit/:slug" element={<EditPostPage />} />
                  </Routes>
                </AdminRoute>
              } />
              
              {/* 404 Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;