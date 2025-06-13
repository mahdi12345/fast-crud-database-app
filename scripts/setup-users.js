import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

async function setupUsers() {
  try {
    const sql = neon(process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/database", {
      disableWarningInBrowsers: true,
    })

    console.log("Creating users table...")

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Check if admin user exists
    const existingUsers = await sql`SELECT * FROM users WHERE email = 'admin@example.com'`

    if (existingUsers.length === 0) {
      console.log("Creating admin user...")

      // Hash the password
      const hashedPassword = await bcrypt.hash("password123", 10)

      // Insert admin user
      await sql`
        INSERT INTO users (name, email, password)
        VALUES ('Admin User', 'admin@example.com', ${hashedPassword})
      `

      console.log("Admin user created!")
    } else {
      console.log("Admin user already exists")
    }

    console.log("Users setup complete!")
  } catch (error) {
    console.error("Error setting up users:", error)
  }
}

setupUsers()
