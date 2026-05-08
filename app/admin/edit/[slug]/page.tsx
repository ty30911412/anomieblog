import EditPostForm from '@/components/EditPostForm'
import AdminRoute from '@/components/AdminRoute'
import { AuthProvider } from '@/contexts/AuthContext'

interface Props {
  params: { slug: string }
}

export default function EditPostPage({ params }: Props) {
  return (
    <AuthProvider>
      <AdminRoute>
        <EditPostForm slug={params.slug} />
      </AdminRoute>
    </AuthProvider>
  )
}
