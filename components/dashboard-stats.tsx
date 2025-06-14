import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CreditCard, Shield, Activity } from "lucide-react"
import { sql } from "@/lib/db"

async function getStats() {
  try {
    // تعداد کل کاربران
    const usersResult = await sql`SELECT COUNT(*) as count FROM users`
    const totalUsers = usersResult[0]?.count || 0

    // تعداد اشتراک‌های فعال
    const activeSubsResult = await sql`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE status = 'active' AND end_date > NOW()
    `
    const activeSubscriptions = activeSubsResult[0]?.count || 0

    // تعداد کل برندها
    const brandsResult = await sql`SELECT COUNT(*) as count FROM brands`
    const totalBrands = brandsResult[0]?.count || 0

    // تعداد دستگاه‌های فعال
    const devicesResult = await sql`
      SELECT COUNT(*) as count FROM user_devices 
      WHERE has_active_session = true
    `
    const activeDevices = devicesResult[0]?.count || 0

    return {
      totalUsers: Number(totalUsers),
      activeSubscriptions: Number(activeSubscriptions),
      totalBrands: Number(totalBrands),
      activeDevices: Number(activeDevices),
    }
  } catch (error) {
    console.error("Error fetching stats:", error)
    return {
      totalUsers: 0,
      activeSubscriptions: 0,
      totalBrands: 0,
      activeDevices: 0,
    }
  }
}

export default async function DashboardStats() {
  const stats = await getStats()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString("fa-IR")}</div>
          <p className="text-xs text-muted-foreground">تعداد کل کاربران ثبت‌شده</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">اشتراک‌های فعال</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeSubscriptions.toLocaleString("fa-IR")}</div>
          <p className="text-xs text-muted-foreground">اشتراک‌های در حال استفاده</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">کل برندها</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBrands.toLocaleString("fa-IR")}</div>
          <p className="text-xs text-muted-foreground">برندهای ثبت‌شده در سیستم</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">دستگاه‌های فعال</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeDevices.toLocaleString("fa-IR")}</div>
          <p className="text-xs text-muted-foreground">دستگاه‌های متصل به سیستم</p>
        </CardContent>
      </Card>
    </div>
  )
}
