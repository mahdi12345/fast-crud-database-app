import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { isSubscriptionExpired } from "@/lib/subscription-utils"

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get("X-API-Key")

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "API key required",
        },
        { status: 401 },
      )
    }

    // Verify API key and get client
    const clients = await sql`
      SELECT * FROM clients 
      WHERE api_key = ${apiKey} AND is_active = true
    `

    if (clients.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid API key",
        },
        { status: 401 },
      )
    }

    const client = clients[0]

    // Get all active subscriptions for this client
    const subscriptions = await sql`
      SELECT 
        s.*,
        p.name as plan_name,
        p.features,
        p.price
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.client_id = ${client.id}
      ORDER BY s.created_at DESC
    `

    const subscriptionData = subscriptions.map((sub) => ({
      code: sub.subscription_code,
      status: sub.status,
      plan: sub.plan_name,
      features: sub.features,
      start_date: sub.start_date,
      end_date: sub.end_date,
      is_expired: isSubscriptionExpired(sub.end_date),
      auto_renew: sub.auto_renew,
    }))

    // Log the API usage
    await sql`
      INSERT INTO subscription_usage_logs (
        subscription_id, client_id, api_endpoint, ip_address, 
        user_agent, request_data, response_status
      )
      VALUES (
        ${subscriptions[0]?.id || null}, ${client.id}, '/api/subscription/status',
        ${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")},
        ${request.headers.get("user-agent")}, ${JSON.stringify({})}, 200
      )
    `

    return NextResponse.json({
      client: {
        name: client.name,
        email: client.email,
      },
      subscriptions: subscriptionData,
    })
  } catch (error) {
    console.error("Subscription status error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
