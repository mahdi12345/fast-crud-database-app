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

    const { deviceId } = await request.json()

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    // Get device info before deletion
    const device = await sql`SELECT * FROM client_devices WHERE id = ${deviceId}`

    if (device.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Remove active sessions for this device
    await sql`
      DELETE FROM active_sessions 
      WHERE client_id = ${device[0].client_id} 
      AND device_fingerprint = ${device[0].device_fingerprint}
    `

    // Remove the device
    await sql`DELETE FROM client_devices WHERE id = ${deviceId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing device:", error)
    return NextResponse.json({ error: "Failed to remove device" }, { status: 500 })
  }
}
