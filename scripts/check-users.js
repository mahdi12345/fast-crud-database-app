import { neon } from "@neondatabase/serverless"

async function checkUsers() {
  try {
    const sql = neon(process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/database", {
      disableWarningInBrowsers: true,
    })

    console.log("Checking users table...")

    // Check if users table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `

    console.log("Users table exists:", tableCheck[0].exists)

    if (!tableCheck[0].exists) {
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
      console.log("Users table created!")
    }

    // List all users
    const users = await sql`SELECT id, name, email, created_at FROM users`

    if (users.length === 0) {
      console.log("No users found in the database.")
    } else {
      console.log(`Found ${users.length} users:`)
      users.forEach((user) => {
        console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Created: ${user.created_at}`)
      })
    }
  } catch (error) {
    console.error("Error checking users:", error)
  }
}

checkUsers()
