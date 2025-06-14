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
          title: "Error",
          description: result.error || "Failed to create subscription",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Subscription created successfully",
        })
        setCreateDialogOpen(false)
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subscription",
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
          title: "Error",
          description: result.error || "Failed to update subscription status",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Subscription status updated",
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription status",
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
          title: "Error",
          description: result.error || "Failed to renew subscription",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Subscription renewed successfully",
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to renew subscription",
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
            <CardTitle>Subscriptions</CardTitle>
            <CardDescription>Manage client subscriptions and billing</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subscription</DialogTitle>
                <DialogDescription>Create a new subscription for a client</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubscription}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="client_id">Client</Label>
                    <Select name="client_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
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
                    <Label htmlFor="plan_id">Plan</Label>
                    <Select name="plan_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
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
                    <Label htmlFor="payment_amount">Payment Amount</Label>
                    <Input id="payment_amount" name="payment_amount" type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="auto_renew" name="auto_renew" />
                    <Label htmlFor="auto_renew">Auto-renew subscription</Label>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" placeholder="Optional notes about this subscription" />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Subscription"}
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
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No subscriptions found. Create your first subscription to get started.
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
                        {subscription.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(subscription.end_date).toLocaleDateString()}
                        {isSubscriptionExpired(subscription.end_date) && (
                          <div className="text-red-500 text-xs">Expired</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription.payment_amount ? formatCurrency(subscription.payment_amount) : "-"}
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
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
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
