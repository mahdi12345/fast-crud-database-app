import BrandList from "@/components/brand-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getSession } from "@/lib/auth-utils"
import { isModerator } from "@/lib/roles"

export default async function Home() {
  const session = await getSession()
  const canCreateBrands = session ? await isModerator() : false

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Brand Management</h1>
        {canCreateBrands && (
          <Link href="/brands/new">
            <Button>Add New Brand</Button>
          </Link>
        )}
      </div>
      <BrandList />
    </main>
  )
}
