import BrandForm from "@/components/brand-form"
import { getBrand } from "@/lib/actions"
import { requireRoleOrHigher, UserRole } from "@/lib/roles"
import { notFound } from "next/navigation"

export default async function EditBrandPage({ params }: { params: { id: string } }) {
  // Ensure user has moderator role or higher
  await requireRoleOrHigher(UserRole.MODERATOR)

  const brand = await getBrand(Number.parseInt(params.id))

  if (!brand) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Edit Brand</h1>
      <BrandForm brand={brand} />
    </div>
  )
}
