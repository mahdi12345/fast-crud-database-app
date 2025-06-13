import { requireRole, UserRole, getAllUsersWithRoles } from "@/lib/roles"
import UserManagement from "@/components/user-management"

export default async function AdminPage() {
  // Ensure only admins can access this page
  await requireRole(UserRole.ADMIN)

  const users = await getAllUsersWithRoles()

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      <UserManagement users={users} />
    </div>
  )
}
