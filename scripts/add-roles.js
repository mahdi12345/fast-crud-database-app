import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

async function addRoles() {
  try {
    const sql = neon(process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/database", {
      disableWarningInBrowsers: true,
    })

    console.log("Adding role column to users table...")

    // Add role column to users table
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'
    `

    console.log("Role column added successfully!")

    // Update existing users to have default role
    await sql`
      UPDATE users 
      SET role = 'user' 
      WHERE role IS NULL
    `

    // Check if admin user exists, if not create one
    const adminUsers = await sql`SELECT * FROM users WHERE role = 'admin'`

    if (adminUsers.length === 0) {
      console.log("Creating admin user...")

      // Hash the password
      const hashedPassword = await bcrypt.hash("admin123", 10)

      // Insert admin user
      await sql`
        INSERT INTO users (name, email, password, role)
        VALUES ('Admin User', 'admin@brandmanager.com', ${hashedPassword}, 'admin')
        ON CONFLICT (email) DO UPDATE SET role = 'admin'
      `

      console.log("Admin user created!")
      console.log("Email: admin@brandmanager.com")
      console.log("Password: admin123")
    }

    // List all users with their roles
    const users = await sql`SELECT id, name, email, role, created_at FROM users ORDER BY role, name`

    console.log("\nUsers and their roles:")
    users.forEach((user) => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role.toUpperCase()}`)
    })
  } catch (error) {
    console.error("Error adding roles:", error)
  }
}

addRoles()
