"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Shield, ShieldOff, Monitor, Smartphone, Tablet } from "lucide-react"

interface Device {
  id: number
  client_id: number
  device_fingerprint: string
  device_name: string
  browser_info: any
  ip_address: string
  first_seen: string
  last_seen: string
  is_active: boolean
  client_name: string
  client_email: string
  has_active_session: boolean
  last_activity: string | null
  subscription_code: string | null
  subscription_status: string | null
}

interface DeviceManagementProps {
  devices: Device[]
}

export default function DeviceManagement({ devices }: DeviceManagementProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState<number | null>(null)

  const getDeviceIcon = (browserInfo: any) => {
    const userAgent = browserInfo?.userAgent?.toLowerCase() || ""

    if (userAgent.includes("mobile") || userAgent.includes("android") || userAgent.includes("iphone")) {
      return <Smartphone className="h-4 w-4" />
    } else if (userAgent.includes("tablet") || userAgent.includes("ipad")) {
      return <Tablet className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  const getDeviceInfo = (browserInfo: any) => {
    if (!browserInfo) return "دستگاه نامشخص"

    const userAgent = browserInfo.userAgent || ""
    const platform = browserInfo.platform || ""

    // Extract browser name
    let browser = "نامشخص"
    if (userAgent.includes("Chrome")) browser = "کروم"
    else if (userAgent.includes("Firefox")) browser = "فایرفاکس"
    else if (userAgent.includes("Safari")) browser = "سافاری"
    else if (userAgent.includes("Edge")) browser = "اج"

    return `${platform} - ${browser}`
  }

  const handleToggleDevice = async (deviceId: number, currentStatus: boolean) => {
    setIsUpdating(deviceId)

    try {
      const response = await fetch("/api/admin/devices/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "به‌روزرسانی وضعیت دستگاه ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: `دستگاه با موفقیت ${currentStatus ? "غیرفعال" : "فعال"} شد`,
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "به‌روزرسانی وضعیت دستگاه ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveDevice = async (deviceId: number) => {
    if (
      !confirm(
        "آیا مطمئن هستید که می‌خواهید این دستگاه را حذف کنید؟ این کار باعث خروج اجباری و جلوگیری از دسترسی آینده خواهد شد.",
      )
    ) {
      return
    }

    setIsUpdating(deviceId)

    try {
      const response = await fetch("/api/admin/devices/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "خطا",
          description: result.error || "حذف دستگاه ناموفق بود",
          variant: "destructive",
        })
      } else {
        toast({
          title: "موفقیت",
          description: "دستگاه با موفقیت حذف شد",
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "حذف دستگاه ناموفق بود",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>دستگاه‌های ثبت‌شده</CardTitle>
        <CardDescription>نظارت و مدیریت دستگاه‌های مشتریان و جلسات فعال</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>دستگاه</TableHead>
                <TableHead>مشتری</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>جلسه</TableHead>
                <TableHead>آخرین بازدید</TableHead>
                <TableHead>آدرس IP</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    هنوز هیچ دستگاهی ثبت نشده است.
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.browser_info)}
                        <div>
                          <div className="font-medium">{device.device_name}</div>
                          <div className="text-sm text-muted-foreground">{getDeviceInfo(device.browser_info)}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {device.device_fingerprint.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{device.client_name}</div>
                        <div className="text-sm text-muted-foreground">{device.client_email}</div>
                        {device.subscription_code && (
                          <div className="text-xs text-muted-foreground">{device.subscription_code}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={device.is_active ? "default" : "secondary"}>
                        {device.is_active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {device.has_active_session ? (
                          <Badge variant="default" className="bg-green-500">
                            آنلاین
                          </Badge>
                        ) : (
                          <Badge variant="outline">آفلاین</Badge>
                        )}
                        {device.last_activity && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(device.last_activity).toLocaleTimeString("fa-IR")}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(device.last_seen).toLocaleDateString("fa-IR")}
                        <div className="text-xs text-muted-foreground">
                          {new Date(device.last_seen).toLocaleTimeString("fa-IR")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{device.ip_address}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleDevice(device.id, device.is_active)}
                          disabled={isUpdating === device.id}
                        >
                          {device.is_active ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveDevice(device.id)}
                          disabled={isUpdating === device.id}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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
