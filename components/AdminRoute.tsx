'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/login')
    }
  }, [currentUser, loading, router])

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-500 font-serif tracking-widest">
        驗證中...
      </div>
    )
  }

  return <>{children}</>
}

export default AdminRoute
