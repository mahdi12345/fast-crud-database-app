import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { UserRole } from "@/lib/types"
import { sql } from "@/lib/db"

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const users = await sql`SELECT role FROM users WHERE id = ${session.id}`
    if (!users.length || users[0].role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 })
    }

    // Build the update query dynamically
    const updates = []
    const values = []

    if (updateData.name) {
      updates.push(`name = $${values.length + 1}`)
      values.push(updateData.name)
    }
    if (updateData.description !== undefined) {
      updates.push(`description = $${values.length + 1}`)
      values.push(updateData.description || null)
    }
    if (updateData.price !== undefined) {
      updates.push(`price = $${values.length + 1}`)
      values.push(updateData.price)
    }
    if (updateData.duration_days !== undefined) {
      updates.push(`duration_days = $${values.length + 1}`)
      values.push(updateData.duration_days)
    }
    if (updateData.max_devices !== undefined) {
      updates.push(`max_devices = $${values.length + 1}`)
      values.push(updateData.max_devices)
    }
    if (updateData.features) {
      updates.push(`features = $${values.length + 1}`)
      values.push(JSON.stringify(updateData.features))
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No data to update" }, { status: 400 })
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const query = `
      UPDATE subscription_plans 
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
    `

    await sql.unsafe(query, values)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating plan:", error)
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
  }
}
