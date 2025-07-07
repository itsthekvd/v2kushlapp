"use client"

// Client-side storage utility for KushL app
import type { ProfileMetrics } from "./profile-scoring"

type UserType = "student" | "employer" | "admin"

export interface User {
  id: string
  fullName: string
  email: string
  whatsappNumber: string
  userType: UserType
  isProfileComplete: boolean
  lastActiveDate?: number
  profileMetrics?: ProfileMetrics
  status?: "active" | "blocked" | "hold"
  password?: string // Add password field
}

export interface StudentProfile extends User {
  userType: "student"
  payment?: {
    bankAccountName?: string
    bankName?: string
    accountType?: "savings" | "current"
    accountNumber?: string
    ifscCode?: string
    upiId?: string
  }
  profile?: {
    profilePicture?: string
    portfolioUrl?: string
    linkedinUrl?: string
    bio?: string
    skills?: string[]
    education?: {
      institution: string
      degree: string
      fieldOfStudy: string
      startYear: number
      endYear?: number
    }[]
    experience?: {
      company: string
      position: string
      startDate: number
      endDate?: number
      description?: string
    }[]
  }
  compliance?: {
    panCard?: string
    aadhaarCard?: string
  }
  paymentHistory?: any[]
}

export interface EmployerProfile extends User {
  userType: "employer"
  payment?: {
    bankAccountName?: string
    bankName?: string
    accountType?: "savings" | "current"
    accountNumber?: string
    ifscCode?: string
    upiId?: string
  }
  profile?: {
    companyLogo?: string
    websiteUrl?: string
    companyDescription?: string
    industry?: string
    companySize?: string
    foundedYear?: number
    location?: string
    socialMediaLinks?: {
      linkedin?: string
      twitter?: string
      facebook?: string
    }
  }
  compliance?: {
    panCard?: string
    aadhaarCard?: string
    gstNumber?: string
    udyogAadhaar?: string
  }
}

export interface AdminProfile extends User {
  userType: "admin"
  adminLevel: "super" | "manager" | "support"
  permissions: {
    manageUsers: boolean
    managePayments: boolean
    viewAnalytics: boolean
    manageContent: boolean
    manageSettings: boolean
  }
}

export interface PaymentRecord {
  id: string
  taskId: string
  amount: number
  platformCommission: number
  paymentDate: string
  status: "pending" | "completed" | "failed"
  paymentUrl?: string
  message?: string
  studentId: string
  employerId: string
  createdAt: number
  updatedAt: number
  transactionId?: string
}

export type UserProfile = StudentProfile | EmployerProfile | AdminProfile

// Storage keys
const USERS_KEY = "kushl_users"
const CURRENT_USER_KEY = "kushl_current_user"
const PAYMENTS_KEY = "kushl_payments"

// Helper functions
export const saveUsers = (users: UserProfile[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }
}

export const getUsers = (): UserProfile[] => {
  if (typeof window !== "undefined") {
    const users = localStorage.getItem(USERS_KEY)
    return users ? JSON.parse(users) : []
  }
  return []
}

export const getCurrentUser = (): UserProfile | null => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem(CURRENT_USER_KEY)
    return user ? JSON.parse(user) : null
  }
  return null
}

export const saveCurrentUser = (user: UserProfile | null): void => {
  if (typeof window !== "undefined") {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(CURRENT_USER_KEY)
    }
  }
}

export const addUser = (user: UserProfile): void => {
  const users = getUsers()
  users.push(user)
  saveUsers(users)
}

export const updateUser = (updatedUser: UserProfile): boolean => {
  try {
    const users = getUsers()
    const index = users.findIndex((u) => u.id === updatedUser.id)

    if (index !== -1) {
      users[index] = updatedUser
      saveUsers(users)
      return true
    }
    return false
  } catch (error) {
    console.error("Error updating user:", error)
    return false
  }
}

export const findUserByEmail = (email: string): UserProfile | undefined => {
  const users = getUsers()
  return users.find((u) => u.email === email)
}

export const findUserByEmailAndPassword = (email: string, password: string): UserProfile | undefined => {
  const users = getUsers()
  return users.find((u) => u.email === email && u.password === password)
}

export const findUserById = (id: string): UserProfile | undefined => {
  const users = getUsers()
  return users.find((u) => u.id === id)
}

// Add getUserById as an alias for findUserById
export const getUserById = findUserById

// Generate unique IDs
export const generateUserId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Alias for backward compatibility
export const generateId = generateUserId

export const getUsersByType = (userType: UserType): UserProfile[] => {
  const users = getUsers()
  return users.filter((user) => user.userType === userType)
}

export const updateUserStatus = (userId: string, status: "active" | "blocked" | "hold"): boolean => {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === userId)

  if (index !== -1) {
    users[index] = { ...users[index], status, updatedAt: Date.now() }
    saveUsers(users)
    return true
  }
  return false
}

export const resetUserPassword = (userId: string): boolean => {
  console.log(`Password reset requested for user ${userId}`)
  return true
}

export const getPayments = (): PaymentRecord[] => {
  if (typeof window !== "undefined") {
    const payments = localStorage.getItem(PAYMENTS_KEY)
    return payments ? JSON.parse(payments) : []
  }
  return []
}

export const getPaymentsByUserId = (userId: string): PaymentRecord[] => {
  const payments = getPayments()
  return payments.filter((payment) => payment.studentId === userId || payment.employerId === userId)
}

export const addPayment = (payment: PaymentRecord): boolean => {
  if (typeof window !== "undefined") {
    const payments = getPayments()
    payments.push(payment)
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
    return true
  }
  return false
}
