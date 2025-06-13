import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await sql`SELECT * FROM users WHERE email = ${email}`

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      // Try to create the user with role
      await sql`
        INSERT INTO users (name, email, password, role)
        VALUES (${name}, ${email}, ${hashedPassword}, 'user')
      `
    } catch (error) {
      // If role column doesn't exist, try without it
      if (error.code === "42703" && error.message.includes('column "role"')) {
        await sql`
          INSERT INTO users (name, email, password)
          VALUES (${name}, ${email}, ${hashedPassword})
        `
      } else {
        // If it's a different error, rethrow it
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  }
}
