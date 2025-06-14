import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Users, CreditCard, BarChart3 } from "lucide-react"
import { getSession } from "@/lib/auth-utils"
import { isModerator, isAdmin } from "@/lib/roles"

export default async function QuickActions() {
  const session = await getSession()
  const canModerate = session ? await isModerator() : false
  const userIsAdmin = session ? await isAdmin() : false

  return (
    <Card>
      <CardHeader>
        <CardTitle>اقدامات سریع</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {canModerate && (
          <Link href="/brands/new" className="block">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              افزودن برند جدید
            </Button>
          </Link>
        )}

        <Link href="/brands" className="block">
          <Button className="w-full justify-start" variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            مشاهده برندها
          </Button>
        </Link>

        {userIsAdmin && (
          <>
            <Link href="/admin/subscriptions" className="block">
              <Button className="w-full justify-start" variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                مدیریت اشتراک‌ها
              </Button>
            </Link>

            <Link href="/admin" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                مدیریت کاربران
              </Button>
            </Link>
          </>
        )}

        <Link href="/profile" className="block">
          <Button className="w-full justify-start" variant="outline">
            <Users className="h-4 w-4 mr-2" />
            ویرایش پروفایل
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
