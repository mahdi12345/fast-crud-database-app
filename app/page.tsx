import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getSession } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { CheckCircle, Shield, Users, BarChart3, Zap, Globe } from "lucide-react"

export default async function Home() {
  const session = await getSession()

  // اگر کاربر لاگین کرده، به داشبورد هدایت شود
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">سیستم مدیریت برند و اشتراک</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            پلتفرم جامع مدیریت برندها، اشتراک‌ها و کاربران با امکانات پیشرفته امنیتی و کنترل دسترسی
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-3">
                شروع رایگان
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                ورود به حساب
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">ویژگی‌های کلیدی</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>مدیریت کاربران</CardTitle>
                <CardDescription>مدیریت کامل کاربران با سطوح دسترسی مختلف</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    نقش‌های مختلف کاربری
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    احراز هویت امن
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    مدیریت پروفایل
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>مدیریت اشتراک</CardTitle>
                <CardDescription>سیستم پیشرفته مدیریت اشتراک‌ها و طرح‌ها</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    طرح‌های متنوع اشتراک
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    کنترل دستگاه‌ها
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    جلوگیری از اشتراک‌گذاری
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>آمار و گزارش</CardTitle>
                <CardDescription>داشبورد جامع با آمار و گزارش‌های تفصیلی</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    آمار لحظه‌ای
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    گزارش‌های تفصیلی
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    نمودارهای تعاملی
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">چرا ما را انتخاب کنید؟</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Zap className="h-6 w-6 text-yellow-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">سرعت بالا</h3>
                    <p className="text-gray-600">پلتفرم بهینه‌سازی شده برای عملکرد بالا</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">امنیت بالا</h3>
                    <p className="text-gray-600">حفاظت پیشرفته از داده‌ها و اطلاعات</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Globe className="h-6 w-6 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">پشتیبانی ۲۴/۷</h3>
                    <p className="text-gray-600">تیم پشتیبانی همیشه در دسترس</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-4">آماده شروع هستید؟</h3>
                <p className="text-gray-600 mb-6">همین حالا ثبت‌نام کنید و از تمام امکانات استفاده کنید</p>
                <Link href="/register">
                  <Button size="lg" className="w-full">
                    ثبت‌نام رایگان
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-4">سیستم مدیریت برند</h3>
          <p className="text-gray-400 mb-6">پلتفرم جامع مدیریت برندها و اشتراک‌ها</p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
                ورود
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700">ثبت‌نام</Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
