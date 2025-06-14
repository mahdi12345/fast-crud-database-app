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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, ToggleLeft, ToggleRight } from "lucide-react"
import { formatCurrency, formatDuration } from "@/lib/subscription-utils"
import type { SubscriptionPlan } from "@/lib/subscription-types"

interface PlanManagementProps {
  plans: SubscriptionPlan[]
}

export default function PlanManagement({ plans }: PlanManagementProps) {
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState<number | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [features, setFeatures] = useState<string[]>([""])

  const handleCreatePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreating(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      price: Number(formData.get("price")),
      duration_days: Number(formData.get("duration_days")),
      max_devices: Number(formData.get("max_devices")),
      features: features.filter((f) => f.trim() !== ""),
    }

    try {
      const response = await fetch("/api/admin/plans/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "ایجاد طرح ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: "طرح با موفقیت ایجاد شد",
        })
        setCreateDialogOpen(false)
        setFeatures([""])
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "ایجاد طرح ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleStatus = async (planId: number) => {
    setIsUpdating(planId)

    try {
      const response = await fetch("/api/admin/plans/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "به‌روزرسانی وضعیت طرح ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: "وضعیت طرح به‌روزرسانی شد",
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "به‌روزرسانی وضعیت طرح ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const addFeature = () => {
    setFeatures([...features, ""])
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = value
    setFeatures(newFeatures)
  }

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>طرح‌های اشتراک</CardTitle>
            <CardDescription>مدیریت طرح‌های اشتراک و قیمت‌گذاری</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                طرح جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>ایجاد طرح جدید</DialogTitle>
                <DialogDescription>طرح اشتراک جدیدی با قیمت‌گذاری و ویژگی‌ها ایجاد کنید</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePlan}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">نام طرح *</Label>
                    <Input id="name" name="name" required placeholder="مثال: طرح پایه" />
                  </div>
                  <div>
                    <Label htmlFor="description">توضیحات</Label>
                    <Textarea id="description" name="description" placeholder="توضیحات طرح" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">قیمت *</Label>
                      <Input id="price" name="price" type="number" step="0.01" required placeholder="29.99" />
                    </div>
                    <div>
                      <Label htmlFor="duration_days">مدت زمان (روز) *</Label>
                      <Input id="duration_days" name="duration_days" type="number" required placeholder="30" />
                    </div>
                    <div>
                      <Label htmlFor="max_devices">حداکثر دستگاه *</Label>
                      <Input
                        id="max_devices"
                        name="max_devices"
                        type="number"
                        min="1"
                        required
                        placeholder="1"
                        defaultValue="1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>ویژگی‌ها</Label>
                    <div className="space-y-2">
                      {features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                            placeholder="توضیح ویژگی"
                          />
                          {features.length > 1 && (
                            <Button type="button" variant="outline" onClick={() => removeFeature(index)}>
                              حذف
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addFeature}>
                        افزودن ویژگی
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "در حال ایجاد..." : "ایجاد طرح"}
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
                <TableHead>قیمت</TableHead>
                <TableHead>مدت زمان</TableHead>
                <TableHead>حداکثر دستگاه</TableHead>
                <TableHead>ویژگی‌ها</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ ایجاد</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    هیچ طرحی یافت نشد. اولین طرح خود را ایجاد کنید.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-muted-foreground max-w-xs truncate">{plan.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(plan.price)}</TableCell>
                    <TableCell>{formatDuration(plan.duration_days)}</TableCell>
                    <TableCell>{plan.max_devices || 1}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {plan.features.slice(0, 2).map((feature, index) => (
                          <div key={index} className="text-sm">
                            • {feature}
                          </div>
                        ))}
                        {plan.features.length > 2 && (
                          <div className="text-sm text-muted-foreground">+{plan.features.length - 2} بیشتر</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(plan.created_at).toLocaleDateString("fa-IR")}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(plan.id)}
                        disabled={isUpdating === plan.id}
                      >
                        {plan.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
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
