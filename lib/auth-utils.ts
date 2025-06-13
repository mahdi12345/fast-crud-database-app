"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sql } from "./db"
import bcrypt from "bcryptjs"

// Simple JWT alternative using encoded JSON
function encodeSession(data: any): string {
  return Buffer.from(JSON.stringify(data)).toString("base64")
}

function decodeSession(token: string): any {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString())
  } catch (e) {
    console.error("Failed to decode session:", e)
    return null
  }
}

// Session duration in seconds (1 day)
const SESSION_DURATION = 86400

export async function login(email: string, password: string, forceUpdate = false) {
  try {
    // Find user by email
    const users = await sql`SELECT * FROM users WHERE email = ${email}`

    if (!users || users.length === 0) {
      console.log("No user found with email:", email)
      return { success: false, message: "Invalid email or password" }
    }

    const user = users[0]
    console.log("User found:", { id: user.id, name: user.name, email: user.email })

    // Skip password check if this is a forced update (e.g., after profile update)
    if (!forceUpdate && password) {
      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password)
      console.log("Password match:", passwordMatch)

      if (!passwordMatch) {
        return { success: false, message: "Invalid email or password" }
      }
    }

    // Create session data (exclude password)
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION,
    }

    // Set session cookie
    cookies().set({
      name: "auth-session",
      value: encodeSession(sessionData),
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION,
      sameSite: "lax",
    })

    console.log("Session created successfully for user:", user.email)
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: "An error occurred during login" }
  }
}

export async function logout() {
  cookies().delete("auth-session")
}

export async function getSession() {
  const sessionCookie = cookies().get("auth-session")

  if (!sessionCookie) {
    return null
  }

  const session = decodeSession(sessionCookie.value)

  // Check if session has expired
  if (!session || session.exp < Math.floor(Date.now() / 1000)) {
    cookies().delete("auth-session")
    return null
  }

  return session
}

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return session
}
