"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  points: number
  unlocked: boolean
  progress: number
  maxProgress: number
}

interface GamificationContextType {
  points: number
  level: number
  streak: number
  achievements: Achievement[]
  addPoints: (amount: number) => void
  incrementStreak: () => void
  resetStreak: () => void
  unlockAchievement: (id: string) => void
  updateAchievementProgress: (id: string, progress: number) => void
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined)

const STORAGE_KEY_PREFIX = "kushl_gamification_"

// Default achievements
const defaultAchievements: Achievement[] = [
  {
    id: "profile_complete",
    title: "Profile Master",
    description: "Complete your profile information",
    icon: "🏆",
    points: 100,
    unlocked: false,
    progress: 0,
    maxProgress: 4, // Basic info, payment, profile, compliance
  },
  {
    id: "first_login",
    title: "First Steps",
    description: "Login to your account for the first time",
    icon: "🔑",
    points: 50,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: "daily_login",
    title: "Dedicated User",
    description: "Login for 7 consecutive days",
    icon: "📅",
    points: 200,
    unlocked: false,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: "first_application",
    title: "Go-Getter",
    description: "Apply for your first opportunity",
    icon: "🚀",
    points: 150,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
]

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id || "guest"

  const [points, setPoints] = useState(0)
  const [level, setLevel] = useState(1)
  const [streak, setStreak] = useState(0)
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements)

  // Load gamification data from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    const loadGamificationData = () => {
      const pointsData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}_points`)
      const streakData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}_streak`)
      const lastLoginDate = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}_last_login`)
      const achievementsData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}_achievements`)

      if (pointsData) setPoints(Number.parseInt(pointsData, 10))
      if (streakData) setStreak(Number.parseInt(streakData, 10))

      // Check if user logged in today
      const today = new Date().toDateString()
      if (lastLoginDate !== today) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}_last_login`, today)

        // Check if last login was yesterday to maintain streak
        if (lastLoginDate) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)

          if (lastLoginDate !== yesterday.toDateString()) {
            // Reset streak if not consecutive
            setStreak(1)
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}_streak`, "1")
          } else {
            // Increment streak for consecutive login
            const newStreak = streak + 1
            setStreak(newStreak)
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}_streak`, newStreak.toString())
          }
        } else {
          // First login
          setStreak(1)
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}_streak`, "1")
          // We'll handle unlocking achievements separately to avoid state updates during render
        }
      }

      if (achievementsData) {
        setAchievements(JSON.parse(achievementsData))
      }
    }

    loadGamificationData()
  }, [userId])

  // Handle first login achievement separately
  useEffect(() => {
    if (user) {
      const lastLoginDate = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}_last_login`)
      if (!lastLoginDate || lastLoginDate === new Date().toDateString()) {
        // Check if first_login achievement is already unlocked
        const firstLoginAchievement = achievements.find((a) => a.id === "first_login")
        if (firstLoginAchievement && !firstLoginAchievement.unlocked) {
          unlockAchievement("first_login")
        }
      }
    }
  }, [user, userId, achievements])

  // Update daily login achievement
  useEffect(() => {
    if (streak > 0) {
      updateAchievementProgress("daily_login", streak)
    }
  }, [streak])

  // Calculate level based on points
  useEffect(() => {
    // Simple level calculation: level = 1 + points / 100
    const newLevel = Math.floor(1 + points / 100)
    setLevel(newLevel)

    // Save points to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}_points`, points.toString())
    }
  }, [points, userId])

  // Add points
  const addPoints = useCallback((amount: number) => {
    setPoints((prev) => prev + amount)
  }, [])

  // Increment streak
  const incrementStreak = useCallback(() => {
    const newStreak = streak + 1
    setStreak(newStreak)

    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}_streak`, newStreak.toString())
    }
  }, [streak, userId])

  // Reset streak
  const resetStreak = useCallback(() => {
    setStreak(0)

    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}_streak`, "0")
    }
  }, [userId])

  // Unlock achievement
  const unlockAchievement = useCallback(
    (id: string) => {
      setAchievements((prev) => {
        const achievement = prev.find((a) => a.id === id)
        if (!achievement || achievement.unlocked) {
          return prev // No changes needed
        }

        // Add points for unlocking achievement
        addPoints(achievement.points)

        const updatedAchievements = prev.map((a) => {
          if (a.id === id) {
            return {
              ...a,
              unlocked: true,
              progress: a.maxProgress,
            }
          }
          return a
        })

        if (typeof window !== "undefined") {
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}_achievements`, JSON.stringify(updatedAchievements))
        }

        return updatedAchievements
      })
    },
    [addPoints, userId],
  )

  // Update achievement progress
  const updateAchievementProgress = useCallback(
    (id: string, progress: number) => {
      setAchievements((prev) => {
        const achievement = prev.find((a) => a.id === id)
        if (!achievement || achievement.unlocked || achievement.progress === progress) {
          return prev // No changes needed
        }

        const updatedAchievements = prev.map((a) => {
          if (a.id === id && !a.unlocked) {
            const newProgress = Math.min(progress, a.maxProgress)

            // If progress is complete, unlock the achievement
            if (newProgress >= a.maxProgress) {
              // We'll handle unlocking separately to avoid nested state updates
              return {
                ...a,
                progress: newProgress,
              }
            }

            return {
              ...a,
              progress: newProgress,
            }
          }
          return a
        })

        if (typeof window !== "undefined") {
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}_achievements`, JSON.stringify(updatedAchievements))
        }

        return updatedAchievements
      })

      // Check if we need to unlock the achievement
      const achievement = achievements.find((a) => a.id === id)
      if (achievement && !achievement.unlocked && progress >= achievement.maxProgress) {
        // Use setTimeout to avoid nested state updates
        setTimeout(() => {
          unlockAchievement(id)
        }, 0)
      }
    },
    [achievements, unlockAchievement, userId],
  )

  return (
    <GamificationContext.Provider
      value={{
        points,
        level,
        streak,
        achievements,
        addPoints,
        incrementStreak,
        resetStreak,
        unlockAchievement,
        updateAchievementProgress,
      }}
    >
      {children}
    </GamificationContext.Provider>
  )
}

export function useGamification() {
  const context = useContext(GamificationContext)
  if (context === undefined) {
    throw new Error("useGamification must be used within a GamificationProvider")
  }
  return context
}
