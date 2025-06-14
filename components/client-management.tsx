"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Plus, Key, ToggleLeft, ToggleRight, Copy } from "lucide-react"
import type { Client } from "@/lib/subscription-types"

interface ClientManagementProps {
  clients: Client[]
}

export default function ClientManagement({ clients }: ClientManagementProps) {
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState<number | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleCreateClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreating(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      company: (formData.get("company") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
    }

    try {
      const response = await fetch("/api/admin/clients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "ایجاد مشتری ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: "مشتری با موفقیت ایجاد شد",
        })
        setCreateDialogOpen(false)
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "ایجاد مشتری ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleStatus = async (clientId: number) => {
    setIsUpdating(clientId)

    try {
      const response = await fetch("/api/admin/clients/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "به‌روزرسانی وضعیت مشتری ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: "وضعیت مشتری به‌روزرسانی شد",
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "به‌روزرسانی وضعیت مشتری ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRegenerateApiKey = async (clientId: number) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید کلید API را بازتولید کنید؟ کلید قدیمی فوراً کار نخواهد کرد.")) {
      return
    }

    setIsUpdating(clientId)

    try {
      const response = await fetch("/api/admin/clients/regenerate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "بازتولید کلید API ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: "کلید API با موفقیت بازتولید شد",
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "بازتولید کلید API ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "کپی شد",
        description: "کلید API در کلیپ‌بورد کپی شد",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "کپی در کلیپ‌بورد ناموفق بود",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>مشتریان</CardTitle>
            <CardDescription>مدیریت مشتریان و کلیدهای API آن‌ها</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                مشتری جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ایجاد مشتری جدید</DialogTitle>
                <DialogDescription>
                  مشتری جدیدی به سیستم اضافه کنید. کلید API به‌طور خودکار تولید خواهد شد.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClient}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">نام *</Label>
                    <Input id="name" name="name" required placeholder="نام مشتری" />
                  </div>
                  <div>
                    <Label htmlFor="email">ایمیل *</Label>
                    <Input id="email" name="email" type="email" required placeholder="client@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="company">شرکت</Label>
                    <Input id="company" name="company" placeholder="نام شرکت" />
                  </div>
                  <div>
                    <Label htmlFor="phone">تلفن</Label>
                    <Input id="phone" name="phone" placeholder="شماره تلفن" />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "در حال ایجاد..." : "ایجاد مشتری"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>ایمیل</TableHead>
                <TableHead>شرکت</TableHead>
                <TableHead>کلید API</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ ایجاد</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    هیچ مشتری‌ای یافت نشد. اولین مشتری خود را ایجاد کنید.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.company || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                          {client.api_key}
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(client.api_key)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(client.created_at).toLocaleDateString("fa-IR")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(client.id)}
                          disabled={isUpdating === client.id}
                        >
                          {client.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateApiKey(client.id)}
                          disabled={isUpdating === client.id}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
