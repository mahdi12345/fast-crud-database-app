"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User } from "@/lib/types"

interface ProfileFormProps {
  user: User
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function handleProfileUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsUpdating(true)
    setProfileError(null)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setProfileError(result.error || "به‌روزرسانی پروفایل ناموفق بود")
      } else {
        toast({
          title: "پروفایل به‌روزرسانی شد",
          description: "اطلاعات پروفایل شما با موفقیت به‌روزرسانی شد.",
        })
      }
    } catch (error) {
      setProfileError("خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.")
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handlePasswordUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsUpdating(true)
    setPasswordError(null)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setPasswordError(result.error || "به‌روزرسانی رمز عبور ناموفق بود")
      } else {
        toast({
          title: "رمز عبور به‌روزرسانی شد",
          description: "رمز عبور شما با موفقیت به‌روزرسانی شد.",
        })
        // Reset password fields
        const form = document.getElementById("password-form") as HTMLFormElement
        if (form) form.reset()
      }
    } catch (error) {
      setPasswordError("خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.")
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="info">اطلاعات پروفایل</TabsTrigger>
        <TabsTrigger value="security">امنیت</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پروفایل</CardTitle>
            <CardDescription>اطلاعات شخصی خود را در اینجا به‌روزرسانی کنید.</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileUpdate}>
            <CardContent className="space-y-4">
              {profileError && <div className="bg-red-50 text-red-500 p-3 rounded-md">{profileError}</div>}
              <div className="space-y-2">
                <Label htmlFor="name">نام</Label>
                <Input id="name" name="name" defaultValue={user.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">ایمیل</Label>
                <Input id="email" name="email" type="email" defaultValue={user.email} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "در حال به‌روزرسانی..." : "به‌روزرسانی پروفایل"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>تغییر رمز عبور</CardTitle>
            <CardDescription>رمز عبور خود را برای حفظ امنیت حساب به‌روزرسانی کنید.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordUpdate} id="password-form">
            <CardContent className="space-y-4">
              {passwordError && <div className="bg-red-50 text-red-500 p-3 rounded-md">{passwordError}</div>}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">رمز عبور فعلی</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">رمز عبور جدید</Label>
                <Input id="newPassword" name="newPassword" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأیید رمز عبور جدید</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "در حال به‌روزرسانی..." : "تغییر رمز عبور"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
