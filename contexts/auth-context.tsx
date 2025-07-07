"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type UserProfile,
  getCurrentUser,
  saveCurrentUser,
  findUserByEmail,
  addUser,
  updateUser,
  generateUserId,
} from "@/lib/storage"
import { useRouter } from "next/navigation"
import { updateUserActivity } from "@/lib/profile-scoring"
import { createDefaultProjectForUser } from "@/lib/default-project"

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (
    userData: Omit<UserProfile, "id" | "isProfileComplete">,
  ) => Promise<{ success: boolean; message: string; userId?: string }>
  logout: () => void
  updateProfile: (updatedData: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>
  refreshUserData: () => UserProfile | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Load user from localStorage on initial render
    const loadUser = () => {
      try {
        const currentUser = getCurrentUser()
        setUser(currentUser)

        // Update user activity if logged in
        if (currentUser) {
          updateUserActivity(currentUser.id)
        }
      } catch (error) {
        console.error("Error loading user:", error)
      } finally {
        // Always set loading to false, even if there's an error
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    // In a real app, you would validate against a backend
    // For now, we'll just check if the user exists in localStorage
    const foundUser = findUserByEmail(email)

    if (foundUser) {
      // In a real app, you would verify the password here
      setUser(foundUser)
      saveCurrentUser(foundUser)

      // Update user activity
      updateUserActivity(foundUser.id)

      // Check if user is admin and redirect to admin dashboard
      if (foundUser.userType === "admin") {
        router.push("/admin/dashboard")
        return { success: true, message: "Login successful" }
      }

      // Check if profile is complete and redirect accordingly
      if (!isProfileComplete(foundUser)) {
        router.push("/profile")
      } else {
        router.push("/")
      }

      return { success: true, message: "Login successful" }
    }

    return { success: false, message: "Invalid email or password" }
  }

  const isProfileComplete = (user: UserProfile) => {
    // Admin users are always considered complete
    if (user.userType === "admin") {
      return true
    }

    // Check if all required sections are filled
    const hasBasicInfo = !!user.fullName && !!user.email && !!user.whatsappNumber

    // Check payment details
    const hasPaymentInfo = !!user.payment?.bankAccountName && !!user.payment?.accountNumber

    // Check profile details
    const hasProfileInfo = user.userType === "student" ? !!user.profile?.profilePicture : !!user.profile?.companyLogo

    // Check compliance details
    const hasComplianceInfo = !!user.compliance?.panCard

    return hasBasicInfo && hasPaymentInfo && hasProfileInfo && hasComplianceInfo
  }

  const register = async (userData: Omit<UserProfile, "id" | "isProfileComplete">) => {
    // Check if user already exists
    const existingUser = findUserByEmail(userData.email)

    if (existingUser) {
      return { success: false, message: "Email already registered" }
    }

    // Generate a unique ID for the new user
    const userId = generateUserId()

    // Create new user with initial profile metrics
    const newUser = {
      ...userData,
      id: userId,
      isProfileComplete: false,
      lastActiveDate: Date.now(),
      profileMetrics: {
        taskCompletionRate: 0,
        averageRating: 0,
        responseTimeMinutes: 60, // Default to 1 hour
        lastActiveDate: Date.now(),
        profileScore: 50, // Default score
      },
    } as UserProfile

    // Add user to storage
    addUser(newUser)
    setUser(newUser)
    saveCurrentUser(newUser)

    // Create default project for employers using the dedicated function
    if (userData.userType === "employer") {
      try {
        await createDefaultProjectForUser(userId, userData.fullName || userData.email)
      } catch (error) {
        console.error("Error creating default project:", error)
        // Continue with registration even if default project creation fails
      }
    }

    console.log("Registration successful, redirecting to profile page")

    // Return success with the user ID
    return { success: true, message: "Registration successful", userId }
  }

  const logout = () => {
    setUser(null)
    saveCurrentUser(null)
    router.push("/login")
  }

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!user) {
      return { success: false, message: "Not logged in" }
    }

    // Check if this update completes the profile
    const updatedUser = { ...user, ...updatedData } as UserProfile

    // Check if all required sections are filled after this update
    const hasBasicInfo = !!updatedUser.fullName && !!updatedUser.email && !!updatedUser.whatsappNumber

    // Check payment details
    const hasPaymentInfo = !!updatedUser.payment?.bankAccountName && !!updatedUser.payment?.accountNumber

    // Check profile details
    const hasProfileInfo =
      updatedUser.userType === "student" ? !!updatedUser.profile?.profilePicture : !!updatedUser.profile?.companyLogo

    // Check compliance details
    const hasComplianceInfo = !!updatedUser.compliance?.panCard

    // Update the isProfileComplete flag
    updatedUser.isProfileComplete = hasBasicInfo && hasPaymentInfo && hasProfileInfo && hasComplianceInfo

    // Update last active date
    updatedUser.lastActiveDate = Date.now()

    updateUser(updatedUser)
    setUser(updatedUser)

    return { success: true, message: "Profile updated successfully" }
  }

  const refreshUserData = () => {
    try {
      const currentUser = getCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      console.error("Error refreshing user data:", error)
      return null
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
