"use server"

import { sql } from "./db"
import { revalidatePath } from "next/cache"
import { requireRole, UserRole } from "./roles"
import { generateApiKey, generateSubscriptionCode, calculateEndDate } from "./subscription-utils"
import type {
  SubscriptionPlan,
  Client,
  Subscription,
  CreateSubscriptionData,
  CreateClientData,
  CreatePlanData,
} from "./subscription-types"

// Subscription Plans Actions
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  await requireRole(UserRole.ADMIN)
  return sql<SubscriptionPlan[]>`
    SELECT * FROM subscription_plans 
    ORDER BY price ASC
  `
}

export async function createSubscriptionPlan(data: CreatePlanData): Promise<void> {
  await requireRole(UserRole.ADMIN)

  await sql`
    INSERT INTO subscription_plans (name, description, price, duration_days, features)
    VALUES (${data.name}, ${data.description || null}, ${data.price}, ${data.duration_days}, ${JSON.stringify(data.features)})
  `

  revalidatePath("/admin/plans")
}

export async function updateSubscriptionPlan(id: number, data: Partial<CreatePlanData>): Promise<void> {
  await requireRole(UserRole.ADMIN)

  const updates = []
  const values = []

  if (data.name) {
    updates.push("name = $" + (values.length + 1))
    values.push(data.name)
  }
  if (data.description !== undefined) {
    updates.push("description = $" + (values.length + 1))
    values.push(data.description)
  }
  if (data.price) {
    updates.push("price = $" + (values.length + 1))
    values.push(data.price)
  }
  if (data.duration_days) {
    updates.push("duration_days = $" + (values.length + 1))
    values.push(data.duration_days)
  }
  if (data.features) {
    updates.push("features = $" + (values.length + 1))
    values.push(JSON.stringify(data.features))
  }

  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP")
    values.push(id)

    await sql.unsafe(
      `
      UPDATE subscription_plans 
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
    `,
      values,
    )
  }

  revalidatePath("/admin/plans")
}

export async function togglePlanStatus(id: number): Promise<void> {
  await requireRole(UserRole.ADMIN)

  await sql`
    UPDATE subscription_plans 
    SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `

  revalidatePath("/admin/plans")
}

// Clients Actions
export async function getClients(): Promise<Client[]> {
  await requireRole(UserRole.ADMIN)
  return sql<Client[]>`
    SELECT * FROM clients 
    ORDER BY created_at DESC
  `
}

export async function createClient(data: CreateClientData): Promise<void> {
  await requireRole(UserRole.ADMIN)

  const apiKey = generateApiKey()

  await sql`
    INSERT INTO clients (name, email, company, phone, api_key)
    VALUES (${data.name}, ${data.email}, ${data.company || null}, ${data.phone || null}, ${apiKey})
  `

  revalidatePath("/admin/clients")
}

export async function toggleClientStatus(id: number): Promise<void> {
  await requireRole(UserRole.ADMIN)

  await sql`
    UPDATE clients 
    SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `

  revalidatePath("/admin/clients")
}

export async function regenerateClientApiKey(id: number): Promise<void> {
  await requireRole(UserRole.ADMIN)

  const newApiKey = generateApiKey()

  await sql`
    UPDATE clients 
    SET api_key = ${newApiKey}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `

  revalidatePath("/admin/clients")
}

// Subscriptions Actions
export async function getSubscriptions(): Promise<Subscription[]> {
  await requireRole(UserRole.ADMIN)
  return sql<Subscription[]>`
    SELECT 
      s.*,
      c.name as client_name,
      c.email as client_email,
      p.name as plan_name,
      p.price as plan_price
    FROM subscriptions s
    JOIN clients c ON s.client_id = c.id
    JOIN subscription_plans p ON s.plan_id = p.id
    ORDER BY s.created_at DESC
  `
}

export async function createSubscription(data: CreateSubscriptionData): Promise<void> {
  await requireRole(UserRole.ADMIN)

  const subscriptionCode = generateSubscriptionCode()
  const startDate = data.start_date ? new Date(data.start_date) : new Date()

  // Get plan duration
  const plans = await sql<SubscriptionPlan[]>`
    SELECT duration_days FROM subscription_plans WHERE id = ${data.plan_id}
  `

  if (plans.length === 0) {
    throw new Error("Plan not found")
  }

  const endDate = calculateEndDate(startDate, plans[0].duration_days)

  await sql`
    INSERT INTO subscriptions (
      client_id, plan_id, subscription_code, start_date, end_date, 
      auto_renew, payment_amount, notes
    )
    VALUES (
      ${data.client_id}, ${data.plan_id}, ${subscriptionCode}, 
      ${startDate.toISOString()}, ${endDate.toISOString()},
      ${data.auto_renew || false}, ${data.payment_amount || null}, ${data.notes || null}
    )
  `

  revalidatePath("/admin/subscriptions")
}

export async function updateSubscriptionStatus(id: number, status: string): Promise<void> {
  await requireRole(UserRole.ADMIN)

  await sql`
    UPDATE subscriptions 
    SET status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `

  revalidatePath("/admin/subscriptions")
}

export async function renewSubscription(id: number, durationDays: number): Promise<void> {
  await requireRole(UserRole.ADMIN)

  const newEndDate = calculateEndDate(new Date(), durationDays)

  await sql`
    UPDATE subscriptions 
    SET 
      status = 'active',
      start_date = CURRENT_TIMESTAMP,
      end_date = ${newEndDate.toISOString()},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `

  revalidatePath("/admin/subscriptions")
}
