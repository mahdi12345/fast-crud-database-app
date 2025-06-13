import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

async function resetAdminPassword() {
  try {
    const sql = neon(process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/database", {
      disableWarningInBrowsers: true,
    })

    const adminEmail = "admin@brandmanager.com"
    const newPassword = "admin123"

    console.log("🔄 Resetting admin password...")

    // Check if admin user exists
    const existingAdmin = await sql`
      SELECT * FROM users WHERE email = ${adminEmail}
    `

    if (existingAdmin.length === 0) {
      console.log("❌ Admin user not found!")
      console.log("Run 'node scripts/create-admin-user.js' first.")
      return
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update admin password
    await sql`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = ${adminEmail}
    `

    console.log("✅ Admin password reset successfully!")
    console.log(`📧 Email: ${adminEmail}`)
    console.log(`🔑 New Password: ${newPassword}`)
    console.log("⚠️  Please change this password after logging in!")
  } catch (error) {
    console.error("❌ Error resetting admin password:", error)
  }
}

resetAdminPassword()
