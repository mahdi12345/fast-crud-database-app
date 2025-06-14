import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateDeviceFingerprint, registerDevice, createSession, validateSession } from "@/lib/device-tracking"
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

    const { subscription_code, device_data, session_token } = await request.json()

    if (!subscription_code || !device_data) {
      return NextResponse.json(
        {
          valid: false,
          error: "Subscription code and device data required",
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
        p.price,
        COALESCE(s.max_devices, p.max_devices, 1) as max_devices
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
    const isSubscriptionValid = subscription.status === "active" && !isExpired

    if (!isSubscriptionValid) {
      return NextResponse.json(
        {
          valid: false,
          error: isExpired ? "Subscription expired" : `Subscription ${subscription.status}`,
        },
        { status: 403 },
      )
    }

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(device_data)
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // If session token provided, validate existing session
    if (session_token) {
      const sessionValidation = await validateSession(session_token, deviceFingerprint)

      if (sessionValidation.valid) {
        // Log the API usage
        await sql`
          INSERT INTO subscription_usage_logs (
            subscription_id, client_id, api_endpoint, ip_address, 
            user_agent, request_data, response_status
          )
          VALUES (
            ${subscription.id}, ${client.id}, '/api/subscription/verify-device',
            ${ipAddress}, ${userAgent}, ${JSON.stringify({ subscription_code, deviceFingerprint: deviceFingerprint })}, 200
          )
        `

        return NextResponse.json({
          valid: true,
          session_token: session_token,
          subscription: {
            code: subscription.subscription_code,
            status: subscription.status,
            plan: subscription.plan_name,
            features: subscription.features,
            end_date: subscription.end_date,
            max_devices: subscription.max_devices,
          },
        })
      }
    }

    // Register or update device
    const deviceRegistration = await registerDevice(client.id, {
      fingerprint: deviceFingerprint,
      deviceName: device_data.deviceName || "دستگاه ناشناس",
      browserInfo: device_data,
      ipAddress: ipAddress,
    })

    if (!deviceRegistration.success) {
      let errorMessage = deviceRegistration.error || "خطا در ثبت دستگاه"

      // Translate common errors to Persian
      if (errorMessage.includes("Device limit reached")) {
        errorMessage = "حداکثر تعداد دستگاه‌های مجاز تجاوز شده است"
      }

      return NextResponse.json(
        {
          valid: false,
          error: errorMessage,
        },
        { status: 403 },
      )
    }

    // Create new session
    const sessionCreation = await createSession(client.id, deviceFingerprint, subscription_code, ipAddress, userAgent)

    if (!sessionCreation.success) {
      const errorMessage = sessionCreation.error || "خطا در ایجاد جلسه"

      return NextResponse.json(
        {
          valid: false,
          error: errorMessage,
        },
        { status: 403 },
      )
    }

    // Log the API usage
    await sql`
      INSERT INTO subscription_usage_logs (
        subscription_id, client_id, api_endpoint, ip_address, 
        user_agent, request_data, response_status
      )
      VALUES (
        ${subscription.id}, ${client.id}, '/api/subscription/verify-device',
        ${ipAddress}, ${userAgent}, ${JSON.stringify({ subscription_code, deviceFingerprint: deviceFingerprint })}, 200
      )
    `

    return NextResponse.json({
      valid: true,
      session_token: sessionCreation.sessionToken,
      subscription: {
        code: subscription.subscription_code,
        status: subscription.status,
        plan: subscription.plan_name,
        features: subscription.features,
        end_date: subscription.end_date,
        max_devices: subscription.max_devices,
      },
    })
  } catch (error) {
    console.error("Device verification error:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
