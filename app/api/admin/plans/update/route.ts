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

    const requestData = await request.json()
    console.log("Received update data:", requestData) // Debug log

    const { id, ...updateData } = requestData

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
    if (updateData.price !== undefined && !isNaN(updateData.price)) {
      updates.push(`price = $${values.length + 1}`)
      values.push(Number(updateData.price))
    }
    if (updateData.duration_days !== undefined && !isNaN(updateData.duration_days)) {
      updates.push(`duration_days = $${values.length + 1}`)
      values.push(Number(updateData.duration_days))
    }
    if (updateData.max_devices !== undefined && !isNaN(updateData.max_devices)) {
      updates.push(`max_devices = $${values.length + 1}`)
      values.push(Number(updateData.max_devices))
    }
    if (updateData.features && Array.isArray(updateData.features)) {
      updates.push(`features = $${values.length + 1}`)
      values.push(JSON.stringify(updateData.features))
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid data to update" }, { status: 400 })
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const query = `
      UPDATE subscription_plans 
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
    `

    console.log("Executing query:", query) // Debug log
    console.log("With values:", values) // Debug log

    const result = await sql.unsafe(query, values)
    console.log("Update result:", result) // Debug log

    return NextResponse.json({ success: true, message: "Plan updated successfully" })
  } catch (error) {
    console.error("Error updating plan:", error)
    return NextResponse.json(
      {
        error: "Failed to update plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
