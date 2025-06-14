import { requireAuth } from "@/lib/auth-utils"
import ProfileForm from "@/components/profile-form"
import { getUserById } from "@/lib/actions"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  // Ensure user is authenticated
  const session = await requireAuth()

  // Get full user data
  const user = await getUserById(session.id)

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">پروفایل شما</h1>
        <ProfileForm user={user} />
      </div>
    </div>
  )
}
