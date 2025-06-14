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
          title: "Error",
          description: result.error || "Failed to create client",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Client created successfully",
        })
        setCreateDialogOpen(false)
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create client",
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
          title: "Error",
          description: result.error || "Failed to update client status",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Client status updated",
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRegenerateApiKey = async (clientId: number) => {
    if (!confirm("Are you sure you want to regenerate the API key? The old key will stop working immediately.")) {
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
          title: "Error",
          description: result.error || "Failed to regenerate API key",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "API key regenerated successfully",
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate API key",
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
        title: "Copied",
        description: "API key copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Clients</CardTitle>
            <CardDescription>Manage clients and their API keys</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Client</DialogTitle>
                <DialogDescription>
                  Add a new client to the system. An API key will be generated automatically.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClient}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" required placeholder="Client name" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required placeholder="client@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" name="company" placeholder="Company name" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" placeholder="Phone number" />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Client"}
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No clients found. Create your first client to get started.
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
                        {client.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
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
