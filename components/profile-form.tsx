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
        setProfileError(result.error || "Failed to update profile")
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
        })
      }
    } catch (error) {
      setProfileError("An unexpected error occurred. Please try again.")
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
        setPasswordError(result.error || "Failed to update password")
      } else {
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully.",
        })
        // Reset password fields
        const form = document.getElementById("password-form") as HTMLFormElement
        if (form) form.reset()
      }
    } catch (error) {
      setPasswordError("An unexpected error occurred. Please try again.")
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="info">Profile Information</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information here.</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileUpdate}>
            <CardContent className="space-y-4">
              {profileError && <div className="bg-red-50 text-red-500 p-3 rounded-md">{profileError}</div>}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={user.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={user.email} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Profile"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordUpdate} id="password-form">
            <CardContent className="space-y-4">
              {passwordError && <div className="bg-red-50 text-red-500 p-3 rounded-md">{passwordError}</div>}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Change Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
