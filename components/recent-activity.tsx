import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { sql } from "@/lib/db"
import { formatDistanceToNow } from "date-fns"
import { faIR } from "date-fns/locale"

async function getRecentActivity() {
  try {
    // آخرین برندهای اضافه شده
    const recentBrands = await sql`
      SELECT name, created_at, 'brand' as type
      FROM brands 
      ORDER BY created_at DESC 
      LIMIT 5
    `

    // آخرین اشتراک‌ها
    const recentSubscriptions = await sql`
      SELECT s.id, u.name as user_name, p.name as plan_name, s.created_at, 'subscription' as type
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN subscription_plans p ON s.plan_id = p.id
      ORDER BY s.created_at DESC 
      LIMIT 5
    `

    // ترکیب و مرتب‌سازی
    const allActivity = [...recentBrands, ...recentSubscriptions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    return allActivity
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return []
  }
}

export default async function RecentActivity() {
  const activities = await getRecentActivity()

  return (
    <Card>
      <CardHeader>
        <CardTitle>فعالیت‌های اخیر</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">هیچ فعالیت اخیری وجود ندارد</p>
          ) : (
            activities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  {activity.type === "brand" ? (
                    <div>
                      <p className="font-medium">برند جدید اضافه شد</p>
                      <p className="text-sm text-gray-600">{activity.name}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">اشتراک جدید</p>
                      <p className="text-sm text-gray-600">
                        {activity.user_name} - {activity.plan_name}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={activity.type === "brand" ? "default" : "secondary"}>
                    {activity.type === "brand" ? "برند" : "اشتراک"}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: faIR,
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
