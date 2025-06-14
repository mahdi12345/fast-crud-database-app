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
    console.log("Received update data:", requestData)

    const { id, name, description, price, duration_days, max_devices, features } = requestData

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 })
    }

    // First, check if the plan exists
    const existingPlan = await sql`SELECT id FROM subscription_plans WHERE id = ${id}`
    if (existingPlan.length === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Update the plan with all fields
    const result = await sql`
      UPDATE subscription_plans 
      SET 
        name = ${name},
        description = ${description || null},
        price = ${Number(price)},
        duration_days = ${Number(duration_days)},
        max_devices = ${Number(max_devices)},
        features = ${JSON.stringify(features || [])},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    console.log("Update executed, result:", result)

    // Verify the update by fetching the updated plan
    const updatedPlan = await sql`
      SELECT * FROM subscription_plans WHERE id = ${id}
    `

    console.log("Updated plan from DB:", updatedPlan[0])

    return NextResponse.json({
      success: true,
      message: "Plan updated successfully",
      plan: updatedPlan[0],
    })
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
