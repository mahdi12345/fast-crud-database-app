import { neon } from "@neondatabase/serverless"

// Create a singleton instance of the Neon client
export const sql = neon(process.env.DATABASE_URL!, {
  disableWarningInBrowsers: true,
})

// Initialize database tables
export async function initializeDatabase() {
  // Create brands table
  await sql`
    CREATE TABLE IF NOT EXISTS brands (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      website VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Create users table with role column
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

  // Add role column if it doesn't exist
  if (!columnCheck[0].exists) {
    await sql`
      ALTER TABLE users 
      ADD COLUMN role VARCHAR(50) DEFAULT 'user'
    `
  }

  // Ensure we have a default admin user
  await ensureAdminUser()
}

// Ensure admin user exists
async function ensureAdminUser() {
  try {
    const adminEmail = "admin@brandmanager.com"

    // Check if admin user exists
    const existingAdmin = await sql`
      SELECT * FROM users WHERE email = ${adminEmail}
    `

    if (existingAdmin.length === 0) {
      // Import bcrypt dynamically to avoid issues
      const bcrypt = await import("bcryptjs")
      const hashedPassword = await bcrypt.hash("admin123", 10)

      // Create admin user
      await sql`
        INSERT INTO users (name, email, password, role)
        VALUES ('System Administrator', ${adminEmail}, ${hashedPassword}, 'admin')
      `

      console.log("✅ Default admin user created")
      console.log("📧 Email: admin@brandmanager.com")
      console.log("🔑 Password: admin123")
    }
  } catch (error) {
    console.error("Error ensuring admin user:", error)
  }
}
