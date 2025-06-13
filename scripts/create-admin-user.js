import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

async function createAdminUser() {
  try {
    const sql = neon(process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/database", {
      disableWarningInBrowsers: true,
    })

    console.log("Setting up default admin user...")

    // Ensure the users table exists with role column
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Check if role column exists (for existing tables)
    const columnCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
      );
    `

    if (!columnCheck[0].exists) {
      console.log("Adding role column to existing users table...")
      await sql`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) DEFAULT 'user'
      `
    }

    // Default admin credentials
    const adminEmail = "admin@brandmanager.com"
    const adminPassword = "admin123"
    const adminName = "System Administrator"

    // Check if admin user already exists
    const existingAdmin = await sql`
      SELECT * FROM users WHERE email = ${adminEmail}
    `

    if (existingAdmin.length > 0) {
      console.log("Admin user already exists!")
      console.log(`Email: ${adminEmail}`)
      console.log("Updating existing admin user role...")

      // Ensure the existing user has admin role
      await sql`
        UPDATE users 
        SET role = 'admin', name = ${adminName}
        WHERE email = ${adminEmail}
      `

      console.log("Admin user role updated!")
    } else {
      console.log("Creating new admin user...")

      // Hash the password
      const hashedPassword = await bcrypt.hash(adminPassword, 10)

      // Create admin user
      await sql`
        INSERT INTO users (name, email, password, role)
        VALUES (${adminName}, ${adminEmail}, ${hashedPassword}, 'admin')
      `

      console.log("✅ Admin user created successfully!")
      console.log("📧 Email: admin@brandmanager.com")
      console.log("🔑 Password: admin123")
      console.log("⚠️  Please change the password after first login!")
    }

    // Create a regular test user as well
    const testUserEmail = "user@brandmanager.com"
    const testUserPassword = "user123"
    const testUserName = "Test User"

    const existingTestUser = await sql`
      SELECT * FROM users WHERE email = ${testUserEmail}
    `

    if (existingTestUser.length === 0) {
      console.log("Creating test user...")

      const hashedTestPassword = await bcrypt.hash(testUserPassword, 10)

      await sql`
        INSERT INTO users (name, email, password, role)
        VALUES (${testUserName}, ${testUserEmail}, ${hashedTestPassword}, 'user')
      `

      console.log("✅ Test user created!")
      console.log("📧 Email: user@brandmanager.com")
      console.log("🔑 Password: user123")
    }

    // List all users
    console.log("\n📋 Current users in database:")
    const allUsers = await sql`
      SELECT id, name, email, role, created_at 
      FROM users 
      ORDER BY role DESC, created_at ASC
    `

    allUsers.forEach((user, index) => {
      const roleEmoji = user.role === "admin" ? "👑" : user.role === "moderator" ? "🛡️" : "👤"
      console.log(`${index + 1}. ${roleEmoji} ${user.name} (${user.email}) - ${user.role.toUpperCase()}`)
    })

    console.log("\n🎉 Database setup complete!")
  } catch (error) {
    console.error("❌ Error creating admin user:", error)
  }
}

createAdminUser()
