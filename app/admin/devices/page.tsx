import { requireRole, UserRole } from "@/lib/roles"
import { sql } from "@/lib/db"
import DeviceManagement from "@/components/device-management"

async function getDevicesWithClients() {
  return sql`
    SELECT 
      cd.*,
      c.name as client_name,
      c.email as client_email,
      CASE 
        WHEN as_active.session_token IS NOT NULL THEN true 
        ELSE false 
      END as has_active_session,
      as_active.last_activity,
      s.subscription_code,
      s.status as subscription_status
    FROM client_devices cd
    JOIN clients c ON cd.client_id = c.id
    LEFT JOIN active_sessions as_active ON cd.client_id = as_active.client_id 
      AND cd.device_fingerprint = as_active.device_fingerprint
      AND as_active.expires_at > CURRENT_TIMESTAMP
    LEFT JOIN subscriptions s ON c.id = s.client_id AND s.status = 'active'
    ORDER BY cd.last_seen DESC
  `
}

export default async function DevicesPage() {
  await requireRole(UserRole.ADMIN)

  const devices = await getDevicesWithClients()

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">مدیریت دستگاه‌ها</h1>
      <DeviceManagement devices={devices} />
    </div>
  )
}
