import EditPostForm from '@/components/EditPostForm'
import AdminRoute from '@/components/AdminRoute'
import { AuthProvider } from '@/contexts/AuthContext'

export default function NewPostPage() {
  return (
    <AuthProvider>
      <AdminRoute>
        <EditPostForm />
      </AdminRoute>
    </AuthProvider>
  )
}
