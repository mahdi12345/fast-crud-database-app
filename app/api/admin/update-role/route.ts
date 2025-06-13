import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth-utils"
import { UserRole } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const users = await sql`SELECT role FROM users WHERE id = ${session.id}`
    if (!users.length || users[0].role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userId, newRole } = await request.json()

    if (!userId || !newRole) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 })
    }

    // Validate role
    if (!Object.values(UserRole).includes(newRole as UserRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    await sql`
      UPDATE users 
      SET role = ${newRole}
      WHERE id = ${Number.parseInt(userId.toString())}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 })
  }
}
