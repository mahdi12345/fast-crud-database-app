import { NextResponse } from "next/server"
import { toggleClientStatus } from "@/lib/subscription-actions"
import { getSession } from "@/lib/auth-utils"
import { UserRole } from "@/lib/types"
import { sql } from "@/lib/db"

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

    const { clientId } = await request.json()
    await toggleClientStatus(clientId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error toggling client status:", error)
    return NextResponse.json({ error: "Failed to toggle client status" }, { status: 500 })
  }
}
