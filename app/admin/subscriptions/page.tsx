import { requireRole, UserRole } from "@/lib/roles"
import { getSubscriptions, getClients, getSubscriptionPlans } from "@/lib/subscription-actions"
import SubscriptionManagement from "@/components/subscription-management"

export default async function SubscriptionsPage() {
  await requireRole(UserRole.ADMIN)

  const [subscriptions, clients, plans] = await Promise.all([getSubscriptions(), getClients(), getSubscriptionPlans()])

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
      <SubscriptionManagement subscriptions={subscriptions} clients={clients} plans={plans} />
    </div>
  )
}
