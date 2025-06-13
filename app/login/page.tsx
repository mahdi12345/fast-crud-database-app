import LoginForm from "@/components/login-form"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-utils"

export default async function LoginPage() {
  const session = await getSession()

  // Redirect to dashboard if already logged in
  if (session) {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-md">
      <h1 className="text-3xl font-bold mb-8 text-center">Login</h1>
      <LoginForm />
    </div>
  )
}
