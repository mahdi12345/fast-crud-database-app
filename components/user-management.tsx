"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserRole } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

interface UserManagementProps {
  users: User[]
}

export default function UserManagement({ users }: UserManagementProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState<number | null>(null)

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return "destructive"
      case UserRole.MODERATOR:
        return "default"
      case UserRole.USER:
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return "مدیر"
      case UserRole.MODERATOR:
        return "ناظر"
      case UserRole.USER:
        return "کاربر"
      default:
        return role
    }
  }

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    setIsUpdating(userId)

    try {
      const response = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, newRole }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "تغییر نقش کاربر ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "نقش به‌روزرسانی شد",
          description: "نقش کاربر با موفقیت به‌روزرسانی شد.",
        })
        // Refresh the page to show updated data
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "تغییر نقش کاربر ناموفق بود.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>مدیریت کاربران</CardTitle>
        <CardDescription>مدیریت نقش‌ها و مجوزهای کاربران</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>ایمیل</TableHead>
                <TableHead>نقش فعلی</TableHead>
                <TableHead>تغییر نقش</TableHead>
                <TableHead>تاریخ عضویت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role}
                      onValueChange={(newRole) => handleRoleChange(user.id, newRole as UserRole)}
                      disabled={isUpdating === user.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.USER}>کاربر</SelectItem>
                        <SelectItem value={UserRole.MODERATOR}>ناظر</SelectItem>
                        <SelectItem value={UserRole.ADMIN}>مدیر</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("fa-IR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
