import RegisterForm from "@/components/register-form"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-utils"

export default async function RegisterPage() {
  const session = await getSession()

  // Redirect to dashboard if already logged in
  if (session) {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-md">
      <h1 className="text-3xl font-bold mb-8 text-center">Register</h1>
      <RegisterForm />
    </div>
  )
}
