// Re-export types from user.services.ts to maintain single source of truth
export type { User, UserRole, CreateUserData, UpdateUserData } from '../services/user.services'
import type { UserRole } from '../services/user.services'

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpData extends LoginCredentials {
  name: string
  role?: UserRole
}
