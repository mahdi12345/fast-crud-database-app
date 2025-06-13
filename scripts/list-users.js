import { neon } from "@neondatabase/serverless"

async function listUsers() {
  try {
    const sql = neon(process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/database", {
      disableWarningInBrowsers: true,
    })

    console.log("📋 Listing all users in the database...\n")

    const users = await sql`
      SELECT id, name, email, role, created_at 
      FROM users 
      ORDER BY role DESC, created_at ASC
    `

    if (users.length === 0) {
      console.log("❌ No users found in the database.")
      console.log("Run 'node scripts/create-admin-user.js' to create the default admin user.")
      return
    }

    console.log(`Found ${users.length} user(s):\n`)

    users.forEach((user, index) => {
      const roleEmoji = user.role === "admin" ? "👑" : user.role === "moderator" ? "🛡️" : "👤"
      const createdDate = new Date(user.created_at).toLocaleDateString()

      console.log(`${index + 1}. ${roleEmoji} ${user.name}`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   🏷️  Role: ${user.role.toUpperCase()}`)
      console.log(`   📅 Created: ${createdDate}`)
      console.log("")
    })

    // Show login instructions for admin
    const adminUser = users.find((user) => user.role === "admin")
    if (adminUser) {
      console.log("🚀 To login as admin:")
      console.log(`   Email: ${adminUser.email}`)
      console.log("   Password: admin123 (change after first login)")
    }
  } catch (error) {
    console.error("❌ Error listing users:", error)
  }
}

listUsers()
