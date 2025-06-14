import Link from "next/link"
import { Button } from "@/components/ui/button"
import UserMenu from "./user-menu"
import { getSession } from "@/lib/auth-utils"
import { isAdmin } from "@/lib/roles"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export default async function NavBar() {
  const session = await getSession()
  const userIsAdmin = session ? await isAdmin() : false

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          مدیر برندها
        </Link>
        <nav className="flex items-center gap-4">
          {userIsAdmin && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    مدیریت
                    <ChevronDown className="h-4 w-4 mr-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link href="/admin">مدیریت کاربران</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/subscriptions">اشتراک‌ها</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/clients">مشتریان</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/plans">طرح‌ها</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/devices">دستگاه‌ها</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          {session ? (
            <UserMenu user={session} />
          ) : (
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="outline">ورود</Button>
              </Link>
              <Link href="/register">
                <Button>ثبت‌نام</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
