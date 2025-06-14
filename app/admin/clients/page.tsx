import { requireRole, UserRole } from "@/lib/roles"
import { getClients } from "@/lib/subscription-actions"
import ClientManagement from "@/components/client-management"

export default async function ClientsPage() {
  await requireRole(UserRole.ADMIN)

  const clients = await getClients()

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">مدیریت مشتریان</h1>
      <ClientManagement clients={clients} />
    </div>
  )
}
