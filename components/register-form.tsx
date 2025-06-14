"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("رمزهای عبور مطابقت ندارند")
      setIsLoading(false)
      return
    }

    try {
      // Register the user
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const registerResult = await registerResponse.json()

      if (!registerResponse.ok) {
        setError(registerResult.error || "ثبت‌نام ناموفق بود")
        setIsLoading(false)
        return
      }

      // Auto-login after successful registration
      const loginFormData = new FormData()
      loginFormData.append("email", email)
      loginFormData.append("password", password)

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        body: loginFormData,
      })

      const loginResult = await loginResponse.json()

      if (!loginResponse.ok) {
        // Registration succeeded but login failed
        router.push("/login?registered=true")
        return
      }

      // Registration and login succeeded
      router.push("/")
      router.refresh()
    } catch (error) {
      setError("مشکلی پیش آمد. لطفاً دوباره تلاش کنید.")
      console.error(error)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>}
      <div className="space-y-2">
        <Label htmlFor="name">نام</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">ایمیل</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">رمز عبور</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">تأیید رمز عبور</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "در حال ایجاد حساب..." : "ثبت‌نام"}
      </Button>
      <div className="text-center text-sm">
        قبلاً حساب کاربری دارید؟{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          ورود
        </Link>
      </div>
    </form>
  )
}
