import Link from "next/link"
import { Button } from "@/components/ui/button"
import UserMenu from "./user-menu"
import { getSession } from "@/lib/auth-utils"
import { isAdmin } from "@/lib/roles"

export default async function NavBar() {
  const session = await getSession()
  const userIsAdmin = session ? await isAdmin() : false

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Brand Manager
        </Link>
        <nav className="flex items-center gap-4">
          {userIsAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin Panel
              </Button>
            </Link>
          )}
          {session ? (
            <UserMenu user={session} />
          ) : (
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
