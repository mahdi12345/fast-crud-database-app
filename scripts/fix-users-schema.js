import { neon } from "@neondatabase/serverless"

async function fixUsersSchema() {
  try {
    const sql = neon(process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/database", {
      disableWarningInBrowsers: true,
    })

    console.log("Checking users table schema...")

    // Check if role column exists
    const columnCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
      );
    `

    if (!columnCheck[0].exists) {
      console.log("Adding role column to users table...")

      await sql`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) DEFAULT 'user'
      `

      console.log("Role column added successfully!")
    } else {
      console.log("Role column already exists.")
    }

    // Update existing users to have default role
    console.log("Setting default role for existing users...")
    await sql`
      UPDATE users 
      SET role = 'user' 
      WHERE role IS NULL
    `

    console.log("Schema update complete!")

    // List all users with their roles
    const users = await sql`SELECT id, name, email, role FROM users`

    if (users.length === 0) {
      console.log("No users found in the database.")
    } else {
      console.log(`Found ${users.length} users:`)
      users.forEach((user) => {
        console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role || "none"}`)
      })
    }
  } catch (error) {
    console.error("Error fixing users schema:", error)
  }
}

fixUsersSchema()
