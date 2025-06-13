import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const formData = await request.formData()
    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "All password fields are required" }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New passwords do not match" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Verify current password
    const users = await sql`SELECT * FROM users WHERE id = ${session.id}`
    const user = users[0]

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await sql`
      UPDATE users
      SET password = ${hashedPassword}
      WHERE id = ${session.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password update error:", error)
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
  }
}
