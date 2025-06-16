import crypto from "crypto"
import { sql } from "./db"

export interface DeviceFingerprint {
  fingerprint: string
  deviceName: string
  browserInfo: {
    userAgent: string
    screen: string
    timezone: string
    language: string
    platform: string
    cookieEnabled: boolean
    doNotTrack: string
  }
  ipAddress: string
}

export interface SessionInfo {
  sessionToken: string
  deviceFingerprint: string
  expiresAt: Date
}

// Generate device fingerprint from browser data (hardware-focused)
export function generateDeviceFingerprint(browserData: any): string {
  // Focus on hardware/system characteristics that are consistent across browsers
  const components = [
    browserData.screen || "",
    browserData.timezone || "",
    browserData.platform || "",
    // Remove browser-specific data like userAgent, cookieEnabled, doNotTrack
    browserData.language || "",
    // Add hardware-specific data if available
    browserData.hardwareConcurrency || navigator.hardwareConcurrency || "",
    browserData.deviceMemory || navigator.deviceMemory || "",
  ]

  const fingerprint = crypto.createHash("sha256").update(components.join("|")).digest("hex")

  return fingerprint.substring(0, 32) // Use first 32 characters
}

// Generate session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Register or update device for client
export async function registerDevice(
  clientId: number,
  deviceData: DeviceFingerprint,
): Promise<{ success: boolean; deviceId?: number; error?: string }> {
  try {
    // Check if device already exists
    const existingDevices = await sql`
      SELECT * FROM client_devices 
      WHERE client_id = ${clientId} AND device_fingerprint = ${deviceData.fingerprint}
    `

    if (existingDevices.length > 0) {
      // Update existing device
      await sql`
        UPDATE client_devices 
        SET 
          last_seen = CURRENT_TIMESTAMP,
          ip_address = ${deviceData.ipAddress},
          browser_info = ${JSON.stringify(deviceData.browserInfo)}
        WHERE id = ${existingDevices[0].id}
      `
      return { success: true, deviceId: existingDevices[0].id }
    }

    // Get client's subscription and device limits
    const subscriptions = await sql`
      SELECT 
        s.max_devices as subscription_max_devices,
        p.max_devices as plan_max_devices
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.client_id = ${clientId} AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `

    if (subscriptions.length === 0) {
      return { success: false, error: "No active subscription found" }
    }

    const maxDevices = subscriptions[0].subscription_max_devices || subscriptions[0].plan_max_devices || 1

    // Count current active devices
    const activeDeviceCount = await sql`
      SELECT COUNT(*) as count 
      FROM client_devices 
      WHERE client_id = ${clientId} AND is_active = true
    `

    if (activeDeviceCount[0].count >= maxDevices) {
      return {
        success: false,
        error: `Device limit reached. Maximum ${maxDevices} device(s) allowed.`,
      }
    }

    // Register new device
    const newDevice = await sql`
      INSERT INTO client_devices (
        client_id, device_fingerprint, device_name, browser_info, ip_address
      )
      VALUES (
        ${clientId}, ${deviceData.fingerprint}, ${deviceData.deviceName}, 
        ${JSON.stringify(deviceData.browserInfo)}, ${deviceData.ipAddress}
      )
      RETURNING id
    `

    return { success: true, deviceId: newDevice[0].id }
  } catch (error) {
    console.error("Error registering device:", error)
    return { success: false, error: "Failed to register device" }
  }
}

// Create active session - allow multiple browsers on same device
export async function createSession(
  clientId: number,
  deviceFingerprint: string,
  subscriptionCode: string,
  ipAddress: string,
  userAgent: string,
): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
  try {
    // Check if device is registered and active
    const devices = await sql`
      SELECT * FROM client_devices 
      WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint} AND is_active = true
    `

    if (devices.length === 0) {
      return { success: false, error: "دستگاه ثبت نشده یا غیرفعال است" }
    }

    // Clean up expired sessions
    await cleanupExpiredSessions()

    // Check for existing active sessions on OTHER devices (different fingerprints)
    const activeSessionsOtherDevices = await sql`
      SELECT COUNT(*) as count 
      FROM active_sessions 
      WHERE client_id = ${clientId} 
      AND device_fingerprint != ${deviceFingerprint}
      AND expires_at > CURRENT_TIMESTAMP
    `

    if (activeSessionsOtherDevices[0].count > 4) {
      return {
        success: false,
        error: "اشتراک شما در دستگاه دیگری فعال است. لطفاً ابتدا از دستگاه دیگر خارج شوید.",
      }
    }

    // Allow multiple sessions on the SAME device (different browsers)
    // Just create a new session without checking existing sessions on same device

    // Create new session (expires in 24 hours)
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO active_sessions (
        client_id, device_fingerprint, session_token, subscription_code,
        ip_address, user_agent, expires_at
      )
      VALUES (
        ${clientId}, ${deviceFingerprint}, ${sessionToken}, ${subscriptionCode},
        ${ipAddress}, ${userAgent}, ${expiresAt.toISOString()}
      )
    `

    return { success: true, sessionToken }
  } catch (error) {
    console.error("Error creating session:", error)
    return { success: false, error: "ایجاد جلسه با خطا مواجه شد" }
  }
}

// Validate active session
export async function validateSession(
  sessionToken: string,
  deviceFingerprint: string,
): Promise<{ valid: boolean; clientId?: number; error?: string }> {
  try {
    const sessions = await sql`
      SELECT * FROM active_sessions 
      WHERE session_token = ${sessionToken} 
      AND device_fingerprint = ${deviceFingerprint}
      AND expires_at > CURRENT_TIMESTAMP
    `

    if (sessions.length === 0) {
      return { valid: false, error: "Invalid or expired session" }
    }

    const session = sessions[0]

    // Update last activity
    await sql`
      UPDATE active_sessions 
      SET last_activity = CURRENT_TIMESTAMP 
      WHERE id = ${session.id}
    `

    return { valid: true, clientId: session.client_id }
  } catch (error) {
    console.error("Error validating session:", error)
    return { valid: false, error: "Session validation failed" }
  }
}

// Cleanup expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await sql`
      DELETE FROM active_sessions 
      WHERE expires_at <= CURRENT_TIMESTAMP
    `
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error)
  }
}

// Deactivate device
export async function deactivateDevice(clientId: number, deviceFingerprint: string): Promise<boolean> {
  try {
    await sql`
      UPDATE client_devices 
      SET is_active = false 
      WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint}
    `

    // Remove active sessions for this device
    await sql`
      DELETE FROM active_sessions 
      WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint}
    `

    return true
  } catch (error) {
    console.error("Error deactivating device:", error)
    return false
  }
}

// Get client devices
export async function getClientDevices(clientId: number) {
  try {
    return await sql`
      SELECT 
        cd.*,
        CASE 
          WHEN as_active.session_token IS NOT NULL THEN true 
          ELSE false 
        END as has_active_session
      FROM client_devices cd
      LEFT JOIN active_sessions as_active ON cd.client_id = as_active.client_id 
        AND cd.device_fingerprint = as_active.device_fingerprint
        AND as_active.expires_at > CURRENT_TIMESTAMP
      WHERE cd.client_id = ${clientId}
      ORDER BY cd.last_seen DESC
    `
  } catch (error) {
    console.error("Error getting client devices:", error)
    return []
  }
}

// Force logout from all devices
export async function forceLogoutAllDevices(clientId: number): Promise<boolean> {
  try {
    await sql`
      DELETE FROM active_sessions 
      WHERE client_id = ${clientId}
    `
    return true
  } catch (error) {
    console.error("Error forcing logout:", error)
    return false
  }
}
