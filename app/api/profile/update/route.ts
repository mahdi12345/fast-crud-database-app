import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth-utils"
import { cookies } from "next/headers"

// Simple JWT alternative using encoded JSON
function encodeSession(data: any): string {
  return Buffer.from(JSON.stringify(data)).toString("base64")
}

// Session duration in seconds (1 day)
const SESSION_DURATION = 86400

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get("name") as string
    const email = formData.get("email") as string

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if email is already in use by another user
    if (email !== session.email) {
      const existingUsers = await sql`
        SELECT * FROM users WHERE email = ${email} AND id != ${session.id}
      `

      if (existingUsers.length > 0) {
        return NextResponse.json({ error: "Email is already in use by another account" }, { status: 400 })
      }
    }

    // Update user information
    await sql`
      UPDATE users
      SET name = ${name}, email = ${email}
      WHERE id = ${session.id}
    `

    // Update session with new information
    const sessionData = {
      id: session.id,
      name: name,
      email: email,
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION,
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set({
      name: "auth-session",
      value: encodeSession(sessionData),
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION,
      sameSite: "lax",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
