import BrandForm from "@/components/brand-form"
import { requireRoleOrHigher, UserRole } from "@/lib/roles"

export default async function NewBrandPage() {
  // Ensure user has moderator role or higher
  await requireRoleOrHigher(UserRole.MODERATOR)

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Add New Brand</h1>
      <BrandForm />
    </div>
  )
}
