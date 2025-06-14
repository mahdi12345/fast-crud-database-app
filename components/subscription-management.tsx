"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Plus, RefreshCw } from "lucide-react"
import { formatCurrency, isSubscriptionExpired } from "@/lib/subscription-utils"
import type { Subscription, Client, SubscriptionPlan } from "@/lib/subscription-types"

interface SubscriptionManagementProps {
  subscriptions: Subscription[]
  clients: Client[]
  plans: SubscriptionPlan[]
}

export default function SubscriptionManagement({ subscriptions, clients, plans }: SubscriptionManagementProps) {
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState<number | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const getStatusBadgeVariant = (status: string, endDate: string) => {
    if (status === "cancelled" || status === "suspended") return "destructive"
    if (status === "expired" || isSubscriptionExpired(endDate)) return "secondary"
    if (status === "active") return "default"
    return "outline"
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "فعال"
      case "expired":
        return "منقضی"
      case "cancelled":
        return "لغو شده"
      case "suspended":
        return "تعلیق"
      default:
        return status
    }
  }

  const handleCreateSubscription = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreating(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      client_id: Number(formData.get("client_id")),
      plan_id: Number(formData.get("plan_id")),
      auto_renew: formData.get("auto_renew") === "on",
      payment_amount: formData.get("payment_amount") ? Number(formData.get("payment_amount")) : undefined,
      notes: (formData.get("notes") as string) || undefined,
    }

    try {
      const response = await fetch("/api/admin/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "ایجاد اشتراک ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: "اشتراک با موفقیت ایجاد شد",
        })
        setCreateDialogOpen(false)
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "ایجاد اشتراک ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleStatusChange = async (subscriptionId: number, newStatus: string) => {
    setIsUpdating(subscriptionId)

    try {
      const response = await fetch("/api/admin/subscriptions/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, status: newStatus }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "به‌روزرسانی وضعیت اشتراک ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: "وضعیت اشتراک به‌روزرسانی شد",
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "به‌روزرسانی وضعیت اشتراک ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRenewSubscription = async (subscriptionId: number, planId: number) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return

    setIsUpdating(subscriptionId)

    try {
      const response = await fetch("/api/admin/subscriptions/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, durationDays: plan.duration_days }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "تمدید اشتراک ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: "اشتراک با موفقیت تمدید شد",
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "تمدید اشتراک ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>اشتراک‌ها</CardTitle>
            <CardDescription>مدیریت اشتراک‌های مشتریان و صورتحساب</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                اشتراک جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ایجاد اشتراک جدید</DialogTitle>
                <DialogDescription>اشتراک جدیدی برای مشتری ایجاد کنید</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubscription}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="client_id">مشتری</Label>
                    <Select name="client_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="مشتری را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients
                          .filter((c) => c.is_active)
                          .map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name} ({client.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="plan_id">طرح</Label>
                    <Select name="plan_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="طرح را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans
                          .filter((p) => p.is_active)
                          .map((plan) => (
                            <SelectItem key={plan.id} value={plan.id.toString()}>
                              {plan.name} - {formatCurrency(plan.price)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_amount">مبلغ پرداخت</Label>
                    <Input id="payment_amount" name="payment_amount" type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="auto_renew" name="auto_renew" />
                    <Label htmlFor="auto_renew">تمدید خودکار اشتراک</Label>
                  </div>
                  <div>
                    <Label htmlFor="notes">یادداشت‌ها</Label>
                    <Textarea id="notes" name="notes" placeholder="یادداشت‌های اختیاری درباره این اشتراک" />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "در حال ایجاد..." : "ایجاد اشتراک"}
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
                <TableHead>مشتری</TableHead>
                <TableHead>طرح</TableHead>
                <TableHead>کد</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ انقضا</TableHead>
                <TableHead>مبلغ</TableHead>
                <TableHead>دستگاه‌ها</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    هیچ اشتراکی یافت نشد. اولین اشتراک خود را ایجاد کنید.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.client_name}</div>
                        <div className="text-sm text-muted-foreground">{subscription.client_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.plan_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(subscription.plan_price || 0)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{subscription.subscription_code}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(subscription.status, subscription.end_date)}>
                        {getStatusLabel(subscription.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(subscription.end_date).toLocaleDateString("fa-IR")}
                        {isSubscriptionExpired(subscription.end_date) && (
                          <div className="text-red-500 text-xs">منقضی شده</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription.payment_amount ? formatCurrency(subscription.payment_amount) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>حداکثر: {subscription.max_devices || 1}</div>
                        <div className="text-muted-foreground">فعال: -</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          defaultValue={subscription.status}
                          onValueChange={(value) => handleStatusChange(subscription.id, value)}
                          disabled={isUpdating === subscription.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">فعال</SelectItem>
                            <SelectItem value="suspended">تعلیق</SelectItem>
                            <SelectItem value="cancelled">لغو شده</SelectItem>
                            <SelectItem value="expired">منقضی</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRenewSubscription(subscription.id, subscription.plan_id)}
                          disabled={isUpdating === subscription.id}
                        >
                          <RefreshCw className="h-4 w-4" />
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
