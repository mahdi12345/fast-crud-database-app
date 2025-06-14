import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { isSubscriptionExpired } from "@/lib/subscription-utils"

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get("X-API-Key")

    if (!apiKey) {
      return NextResponse.json(
        {
          valid: false,
          error: "API key required",
        },
        { status: 401 },
      )
    }

    const { subscription_code } = await request.json()

    if (!subscription_code) {
      return NextResponse.json(
        {
          valid: false,
          error: "Subscription code required",
        },
        { status: 400 },
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
          valid: false,
          error: "Invalid API key",
        },
        { status: 401 },
      )
    }

    const client = clients[0]

    // Get subscription with plan details
    const subscriptions = await sql`
      SELECT 
        s.*,
        p.name as plan_name,
        p.features,
        p.price
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.subscription_code = ${subscription_code} 
      AND s.client_id = ${client.id}
    `

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          valid: false,
          error: "Subscription not found",
        },
        { status: 404 },
      )
    }

    const subscription = subscriptions[0]

    // Check subscription status and expiry
    const isExpired = isSubscriptionExpired(subscription.end_date)
    const isValid = subscription.status === "active" && !isExpired

    // Log the API usage
    await sql`
      INSERT INTO subscription_usage_logs (
        subscription_id, client_id, api_endpoint, ip_address, 
        user_agent, request_data, response_status
      )
      VALUES (
        ${subscription.id}, ${client.id}, '/api/subscription/verify',
        ${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")},
        ${request.headers.get("user-agent")}, ${JSON.stringify({ subscription_code })},
        ${isValid ? 200 : 403}
      )
    `

    if (!isValid) {
      return NextResponse.json(
        {
          valid: false,
          error: isExpired ? "Subscription expired" : `Subscription ${subscription.status}`,
        },
        { status: 403 },
      )
    }

    return NextResponse.json({
      valid: true,
      subscription: {
        code: subscription.subscription_code,
        status: subscription.status,
        plan: subscription.plan_name,
        features: subscription.features,
        end_date: subscription.end_date,
        auto_renew: subscription.auto_renew,
      },
    })
  } catch (error) {
    console.error("Subscription verification error:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
