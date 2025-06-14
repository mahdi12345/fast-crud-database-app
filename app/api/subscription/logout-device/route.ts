import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get("X-API-Key")

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 })
    }

    const { session_token, device_fingerprint } = await request.json()

    if (!session_token || !device_fingerprint) {
      return NextResponse.json({ error: "Session token and device fingerprint required" }, { status: 400 })
    }

    // Verify API key
    const clients = await sql`
      SELECT * FROM clients 
      WHERE api_key = ${apiKey} AND is_active = true
    `

    if (clients.length === 0) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const client = clients[0]

    // Remove the session
    await sql`
      DELETE FROM active_sessions 
      WHERE session_token = ${session_token} 
      AND device_fingerprint = ${device_fingerprint}
      AND client_id = ${client.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
