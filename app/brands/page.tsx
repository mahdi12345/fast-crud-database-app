import BrandList from "@/components/brand-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { isModerator } from "@/lib/roles"

export default async function BrandsPage() {
  const session = await requireAuth()
  const canCreateBrands = await isModerator()

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">مدیریت برندها</h1>
        {canCreateBrands && (
          <Link href="/brands/new">
            <Button>افزودن برند جدید</Button>
          </Link>
        )}
      </div>
      <BrandList />
    </main>
  )
}
