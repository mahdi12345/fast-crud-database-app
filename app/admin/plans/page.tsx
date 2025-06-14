import { requireRole, UserRole } from "@/lib/roles"
import { getSubscriptionPlans } from "@/lib/subscription-actions"
import PlanManagement from "@/components/plan-management"

export default async function PlansPage() {
  await requireRole(UserRole.ADMIN)

  const plans = await getSubscriptionPlans()

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">طرح‌های اشتراک</h1>
      <PlanManagement plans={plans} />
    </div>
  )
}
