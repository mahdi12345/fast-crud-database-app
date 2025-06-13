export interface Brand {
  id: number
  name: string
  description: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export interface BrandInput {
  name: string
  description: string | null
  website: string | null
}

export interface User {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

export enum UserRole {
  ADMIN = "admin",
  MODERATOR = "moderator",
  USER = "user",
}
