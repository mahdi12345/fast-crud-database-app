export interface SubscriptionPlan {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: number
  name: string
  email: string
  company: string | null
  phone: string | null
  api_key: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: number
  client_id: number
  plan_id: number
  subscription_code: string
  status: "active" | "expired" | "cancelled" | "suspended"
  start_date: string
  end_date: string
  auto_renew: boolean
  payment_amount: number | null
  payment_date: string | null
  notes: string | null
  max_devices?: number
  created_at: string
  updated_at: string
  // Joined data
  client_name?: string
  client_email?: string
  plan_name?: string
  plan_price?: number
}

export interface SubscriptionUsageLog {
  id: number
  subscription_id: number
  client_id: number
  api_endpoint: string | null
  ip_address: string | null
  user_agent: string | null
  request_data: any
  response_status: number | null
  created_at: string
}

export interface CreateSubscriptionData {
  client_id: number
  plan_id: number
  start_date?: string
  auto_renew?: boolean
  payment_amount?: number
  notes?: string
}

export interface CreateClientData {
  name: string
  email: string
  company?: string
  phone?: string
}

export interface CreatePlanData {
  name: string
  description?: string
  price: number
  duration_days: number
  features: string[]
  max_devices?: number
}
