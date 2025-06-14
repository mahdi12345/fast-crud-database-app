"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "ایمیل یا رمز عبور نامعتبر است")
        setIsPending(false)
        return
      }

      // Only redirect on success
      router.push("/")
      router.refresh()
    } catch (err) {
      setError("خطای غیرمنتظره‌ای رخ داد")
      console.error(err)
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>}
      <div className="space-y-2">
        <Label htmlFor="email">ایمیل</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">رمز عبور</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "در حال ورود..." : "ورود"}
      </Button>
      <div className="text-center text-sm">
        حساب کاربری ندارید؟{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          ثبت‌نام
        </Link>
      </div>
    </form>
  )
}
