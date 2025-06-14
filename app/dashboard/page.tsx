import { requireAuth } from "@/lib/auth-utils"
import DashboardStats from "@/components/dashboard-stats"
import RecentActivity from "@/components/recent-activity"
import QuickActions from "@/components/quick-actions"

export default async function DashboardPage() {
  const session = await requireAuth()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">خوش آمدید، {session.name}</h1>
        <p className="text-gray-600 mt-2">نمای کلی از وضعیت سیستم و فعالیت‌های اخیر</p>
      </div>

      {/* آمار کلی */}
      <DashboardStats />

      <div className="grid lg:grid-cols-3 gap-8 mt-8">
        {/* اقدامات سریع */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>

        {/* فعالیت‌های اخیر */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
