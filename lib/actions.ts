"use server"

import { revalidatePath } from "next/cache"
import type { Brand, BrandInput, User } from "./types"
import { sql, initializeDatabase } from "./db"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { getSession } from "./auth-utils"
import { requireRoleOrHigher, requireRole, UserRole } from "./roles"

// Get all brands
export async function getBrands(): Promise<Brand[]> {
  await initializeDatabase()
  return sql<Brand[]>`SELECT * FROM brands ORDER BY created_at DESC`
}

// Get a single brand by ID
export async function getBrand(id: number): Promise<Brand | null> {
  const brands = await sql<Brand[]>`SELECT * FROM brands WHERE id = ${id}`
  return brands.length > 0 ? brands[0] : null
}

// Create a new brand (requires moderator role or higher)
export async function createBrand(brand: BrandInput): Promise<Brand> {
  // Check authentication and role
  const session = await getSession()
  if (!session) {
    throw new Error("Authentication required")
  }

  await requireRoleOrHigher(UserRole.MODERATOR)

  const { name, description, website } = brand

  const result = await sql<Brand[]>`
    INSERT INTO brands (name, description, website)
    VALUES (${name}, ${description}, ${website})
    RETURNING *
  `

  revalidatePath("/")
  return result[0]
}

// Update an existing brand (requires moderator role or higher)
export async function updateBrand(id: number, brand: BrandInput): Promise<Brand> {
  // Check authentication and role
  const session = await getSession()
  if (!session) {
    throw new Error("Authentication required")
  }

  await requireRoleOrHigher(UserRole.MODERATOR)

  const { name, description, website } = brand

  const result = await sql<Brand[]>`
    UPDATE brands
    SET name = ${name}, description = ${description}, website = ${website}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `

  revalidatePath("/")
  revalidatePath(`/brands/${id}/edit`)
  return result[0]
}

// Delete a brand (requires admin role)
export async function deleteBrand(id: number): Promise<void> {
  // Check authentication and role
  const session = await getSession()
  if (!session) {
    throw new Error("Authentication required")
  }

  await requireRoleOrHigher(UserRole.ADMIN)

  await sql`DELETE FROM brands WHERE id = ${id}`
  revalidatePath("/")
}

// Delete brand action for forms
export async function deleteBrandAction(formData: FormData) {
  const brandId = formData.get("brandId") as string
  if (!brandId) {
    throw new Error("Brand ID is required")
  }

  await deleteBrand(Number.parseInt(brandId))
  revalidatePath("/")
}

// Register a new user
export async function registerUser({ name, email, password }: { name: string; email: string; password: string }) {
  try {
    // Check if user already exists
    const existingUsers = await sql`SELECT * FROM users WHERE email = ${email}`

    if (existingUsers.length > 0) {
      return { error: "Email already in use" }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user with default role
    await sql`
      INSERT INTO users (name, email, password, role)
      VALUES (${name}, ${email}, ${hashedPassword}, 'user')
    `

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Failed to register user" }
  }
}

// Login action - Fixed to handle errors properly
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    // Import dynamically to avoid the crypto error
    const { login } = await import("./auth-utils")
    const result = await login(email, password)

    if (!result.success) {
      return { error: result.message || "Invalid email or password" }
    }

    // Only redirect on success
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Logout action
export async function logoutAction() {
  const { logout } = await import("./auth-utils")
  await logout()
  redirect("/login")
}

// Get user by ID
export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await sql<User[]>`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE id = ${id}
    `

    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

// Update user profile
export async function updateProfile(formData: FormData) {
  try {
    const session = await getSession()
    if (!session) {
      return { error: "Authentication required" }
    }

    const name = formData.get("name") as string
    const email = formData.get("email") as string

    if (!name || !email) {
      return { error: "Name and email are required" }
    }

    // Check if email is already in use by another user
    if (email !== session.email) {
      const existingUsers = await sql`
        SELECT * FROM users WHERE email = ${email} AND id != ${session.id}
      `

      if (existingUsers.length > 0) {
        return { error: "Email is already in use by another account" }
      }
    }

    // Update user information
    await sql`
      UPDATE users
      SET name = ${name}, email = ${email}
      WHERE id = ${session.id}
    `

    // Update session with new information
    const { login } = await import("./auth-utils")
    await login(email, "", true) // Force session update without password check

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Profile update error:", error)
    return { error: "Failed to update profile" }
  }
}

// Update user password
export async function updatePassword(formData: FormData) {
  try {
    const session = await getSession()
    if (!session) {
      return { error: "Authentication required" }
    }

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: "All password fields are required" }
    }

    if (newPassword !== confirmPassword) {
      return { error: "New passwords do not match" }
    }

    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters long" }
    }

    // Verify current password
    const users = await sql`SELECT * FROM users WHERE id = ${session.id}`
    const user = users[0]

    if (!user) {
      return { error: "User not found" }
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordMatch) {
      return { error: "Current password is incorrect" }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await sql`
      UPDATE users
      SET password = ${hashedPassword}
      WHERE id = ${session.id}
    `

    return { success: true }
  } catch (error) {
    console.error("Password update error:", error)
    return { error: "Failed to update password" }
  }
}

// Update user role action (admin only)
export async function updateUserRoleAction(formData: FormData) {
  try {
    await requireRole(UserRole.ADMIN)

    const userId = formData.get("userId") as string
    const newRole = formData.get("newRole") as string

    if (!userId || !newRole) {
      return { error: "User ID and role are required" }
    }

    await sql`
      UPDATE users 
      SET role = ${newRole}
      WHERE id = ${Number.parseInt(userId)}
    `

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error updating user role:", error)
    return { error: "Failed to update user role" }
  }
}
