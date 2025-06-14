-- Add device tracking tables
CREATE TABLE IF NOT EXISTS client_devices (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  browser_info JSONB,
  ip_address INET,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add session tracking table
CREATE TABLE IF NOT EXISTS active_sessions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  subscription_code VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add device limits to subscription plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 1;

-- Add device limits to subscriptions (can override plan default)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS max_devices INTEGER;

-- Update existing plans with device limits
UPDATE subscription_plans SET max_devices = 1 WHERE max_devices IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_devices_client_id ON client_devices(client_id);
CREATE INDEX IF NOT EXISTS idx_client_devices_fingerprint ON client_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_active_sessions_client_id ON active_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires ON active_sessions(expires_at);
