"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBrand, updateBrand } from "@/lib/actions"
import type { Brand } from "@/lib/types"
import Link from "next/link"

export default function BrandForm({ brand }: { brand?: Brand }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const brandData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      website: formData.get("website") as string,
    }

    try {
      if (brand) {
        await updateBrand(brand.id, brandData)
      } else {
        await createBrand(brandData)
      }
      router.push("/")
      router.refresh()
    } catch (err) {
      setError("ذخیره برند ناموفق بود. لطفاً دوباره تلاش کنید.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>}
      <div className="space-y-2">
        <Label htmlFor="name">نام برند</Label>
        <Input id="name" name="name" required defaultValue={brand?.name || ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">توضیحات</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={brand?.description || ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">وب‌سایت</Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://example.com"
          defaultValue={brand?.website || ""}
        />
      </div>
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "در حال ذخیره..." : brand ? "به‌روزرسانی برند" : "ایجاد برند"}
        </Button>
        <Link href="/">
          <Button variant="outline" type="button">
            انصراف
          </Button>
        </Link>
      </div>
    </form>
  )
}
