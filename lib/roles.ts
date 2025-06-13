import { getSession } from "./auth-utils"
import { sql } from "./db"

// Define available roles
export enum UserRole {
  ADMIN = "admin",
  MODERATOR = "moderator",
  USER = "user",
}

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
}

// Get current user's role
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const session = await getSession()

  if (!session) {
    return null
  }

  try {
    const users = await sql`
      SELECT role FROM users WHERE id = ${session.id}
    `

    if (users.length === 0) {
      return null
    }

    return users[0].role as UserRole
  } catch (error) {
    console.error("Error getting user role:", error)
    return null
  }
}

// Check if user has specific role
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const userRole = await getCurrentUserRole()

  if (!userRole) {
    return false
  }

  return userRole === requiredRole
}

// Check if user has role or higher (based on hierarchy)
export async function hasRoleOrHigher(requiredRole: UserRole): Promise<boolean> {
  const userRole = await getCurrentUserRole()

  if (!userRole) {
    return false
  }

  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0

  return userLevel >= requiredLevel
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  return hasRole(UserRole.ADMIN)
}

// Check if user is moderator or admin
export async function isModerator(): Promise<boolean> {
  return hasRoleOrHigher(UserRole.MODERATOR)
}

// Require specific role (throws error if not authorized)
export async function requireRole(requiredRole: UserRole) {
  const hasPermission = await hasRole(requiredRole)

  if (!hasPermission) {
    throw new Error(`Access denied. Required role: ${requiredRole}`)
  }
}

// Require role or higher (throws error if not authorized)
export async function requireRoleOrHigher(requiredRole: UserRole) {
  const hasPermission = await hasRoleOrHigher(requiredRole)

  if (!hasPermission) {
    throw new Error(`Access denied. Required role: ${requiredRole} or higher`)
  }
}

// Get user with role information
export async function getUserWithRole(userId: number) {
  try {
    const users = await sql`
      SELECT id, name, email, role, created_at
      FROM users 
      WHERE id = ${userId}
    `

    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error("Error getting user with role:", error)
    return null
  }
}

// Get all users with their roles (admin only)
export async function getAllUsersWithRoles() {
  await requireRole(UserRole.ADMIN)

  try {
    return await sql`
      SELECT id, name, email, role, created_at
      FROM users 
      ORDER BY role, name
    `
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}
