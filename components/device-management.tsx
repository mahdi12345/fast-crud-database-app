import type React from "react"

interface Device {
  id: string
  last_seen: string
  ip_address: string
  browser_info: string
  has_active_session: boolean
}

interface DeviceManagementProps {
  devices: Device[]
}

const DeviceManagement: React.FC<DeviceManagementProps> = ({ devices }) => {
  return (
    <div>
      <h2>Device Management</h2>
      {devices.length > 0 ? (
        <ul>
          {devices.map((device) => (
            <li key={device.id}>
              <div>Device ID: {device.id}</div>
              <div className="text-sm text-muted-foreground">
                <div>آخرین بازدید: {new Date(device.last_seen).toLocaleDateString("fa-IR")}</div>
                <div>IP: {device.ip_address}</div>
                <div>مرورگر: {JSON.parse(device.browser_info).platform}</div>
                <div>جلسات فعال: {device.has_active_session ? "بله" : "خیر"}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No devices found.</p>
      )}
    </div>
  )
}

export default DeviceManagement
