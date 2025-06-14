"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, ToggleLeft, ToggleRight, Edit, Trash2 } from "lucide-react"
import { formatCurrency, formatDuration } from "@/lib/subscription-utils"
import type { SubscriptionPlan } from "@/lib/subscription-types"

interface PlanManagementProps {
  plans: SubscriptionPlan[]
}

export default function PlanManagement({ plans: initialPlans }: PlanManagementProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [plans, setPlans] = useState(initialPlans)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [features, setFeatures] = useState<string[]>([""])
  const [editFeatures, setEditFeatures] = useState<string[]>([""])

  const refreshPlans = async () => {
    try {
      const response = await fetch("/api/admin/plans")
      if (response.ok) {
        const newPlans = await response.json()
        setPlans(newPlans)
      }
    } catch (error) {
      console.error("Error refreshing plans:", error)
    }
  }

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
        // Reset form
        const form = event.currentTarget
        form.reset()
        // Refresh plans list
        await refreshPlans()
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

  const handleEditPlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingPlan) return

    setIsUpdating(editingPlan.id)

    const formData = new FormData(event.currentTarget)
    const data = {
      id: editingPlan.id,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      price: Number(formData.get("price")),
      duration_days: Number(formData.get("duration_days")),
      max_devices: Number(formData.get("max_devices")),
      features: editFeatures.filter((f) => f.trim() !== ""),
    }

    console.log("Updating plan with data:", data) // Debug log

    try {
      const response = await fetch("/api/admin/plans/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      console.log("Update response:", result) // Debug log

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "به‌روزرسانی طرح ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: "طرح با موفقیت به‌روزرسانی شد",
        })
        setEditDialogOpen(false)
        setEditingPlan(null)
        // Refresh plans list
        await refreshPlans()
      }
    } catch (error) {
      console.error("Update error:", error) // Debug log
      toast({
        title: "خطا",
        description: "به‌روزرسانی طرح ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleDeletePlan = async (planId: number) => {
    setIsDeleting(planId)

    try {
      const response = await fetch("/api/admin/plans/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "حذف طرح ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: "طرح با موفقیت حذف شد",
        })
        // Refresh plans list
        await refreshPlans()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "حذف طرح ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
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
        // Refresh plans list
        await refreshPlans()
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

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setEditFeatures(plan.features.length > 0 ? plan.features : [""])
    setEditDialogOpen(true)
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

  const addEditFeature = () => {
    setEditFeatures([...editFeatures, ""])
  }

  const updateEditFeature = (index: number, value: string) => {
    const newFeatures = [...editFeatures]
    newFeatures[index] = value
    setEditFeatures(newFeatures)
  }

  const removeEditFeature = (index: number) => {
    setEditFeatures(editFeatures.filter((_, i) => i !== index))
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(plan.id)}
                          disabled={isUpdating === plan.id}
                        >
                          {plan.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(plan)}
                          disabled={isUpdating === plan.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isDeleting === plan.id}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف طرح</AlertDialogTitle>
                              <AlertDialogDescription>
                                آیا مطمئن هستید که می‌خواهید طرح "{plan.name}" را حذف کنید؟ این عمل قابل بازگشت نیست.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>لغو</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePlan(plan.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ویرایش طرح</DialogTitle>
            <DialogDescription>اطلاعات طرح اشتراک را ویرایش کنید</DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <form onSubmit={handleEditPlan}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">نام طرح *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    required
                    defaultValue={editingPlan.name}
                    placeholder="مثال: طرح پایه"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">توضیحات</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingPlan.description || ""}
                    placeholder="توضیحات طرح"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-price">قیمت *</Label>
                    <Input
                      id="edit-price"
                      name="price"
                      type="number"
                      step="0.01"
                      required
                      defaultValue={editingPlan.price}
                      placeholder="29.99"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-duration_days">مدت زمان (روز) *</Label>
                    <Input
                      id="edit-duration_days"
                      name="duration_days"
                      type="number"
                      required
                      defaultValue={editingPlan.duration_days}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-max_devices">حداکثر دستگاه *</Label>
                    <Input
                      id="edit-max_devices"
                      name="max_devices"
                      type="number"
                      min="1"
                      required
                      defaultValue={editingPlan.max_devices || 1}
                      placeholder="1"
                    />
                  </div>
                </div>
                <div>
                  <Label>ویژگی‌ها</Label>
                  <div className="space-y-2">
                    {editFeatures.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateEditFeature(index, e.target.value)}
                          placeholder="توضیح ویژگی"
                        />
                        {editFeatures.length > 1 && (
                          <Button type="button" variant="outline" onClick={() => removeEditFeature(index)}>
                            حذف
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addEditFeature}>
                      افزودن ویژگی
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" disabled={isUpdating === editingPlan.id}>
                  {isUpdating === editingPlan.id ? "در حال به‌روزرسانی..." : "به‌روزرسانی طرح"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
