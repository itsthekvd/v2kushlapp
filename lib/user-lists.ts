"use client"

// User lists management for KushL app

// Storage keys
const BANNED_USERS_KEY = "kushl_banned_users"
const DISCOURAGED_USERS_KEY = "kushl_discouraged_users"
const ENCOURAGED_USERS_KEY = "kushl_encouraged_users"

// User list types
export type UserListType = "banned" | "discouraged" | "encouraged"

// User list item interface
export interface UserListItem {
  userId: string
  username: string
  email: string
  addedAt: number
  addedBy: string
  reason: string
}

// Get all users from a specific list
export function getUsersFromList(listType: UserListType): UserListItem[] {
  try {
    const listKey = `kushl_${listType}_users`
    const listData = localStorage.getItem(listKey)
    return listData ? JSON.parse(listData) : []
  } catch (error) {
    console.error(`Error getting ${listType} users:`, error)
    return []
  }
}

// Add a user to a list
export function addUserToList(listType: UserListType, user: Omit<UserListItem, "addedAt">): boolean {
  try {
    const listKey = `kushl_${listType}_users`
    const currentList = getUsersFromList(listType)

    // Check if user already exists in the list
    const existingUser = currentList.find((item) => item.userId === user.userId)
    if (existingUser) {
      return false
    }

    // Add user to the list with timestamp
    const newList = [
      ...currentList,
      {
        ...user,
        addedAt: Date.now(),
      },
    ]

    localStorage.setItem(listKey, JSON.stringify(newList))
    return true
  } catch (error) {
    console.error(`Error adding user to ${listType} list:`, error)
    return false
  }
}

// Remove a user from a list
export function removeUserFromList(listType: UserListType, userId: string): boolean {
  try {
    const listKey = `kushl_${listType}_users`
    const currentList = getUsersFromList(listType)
    const newList = currentList.filter((user) => user.userId !== userId)

    if (newList.length === currentList.length) {
      return false // User not found
    }

    localStorage.setItem(listKey, JSON.stringify(newList))
    return true
  } catch (error) {
    console.error(`Error removing user from ${listType} list:`, error)
    return false
  }
}

// Check if a user is in a list
export function isUserInList(listType: UserListType, userId: string): boolean {
  try {
    const list = getUsersFromList(listType)
    return list.some((user) => user.userId === userId)
  } catch (error) {
    console.error(`Error checking if user is in ${listType} list:`, error)
    return false
  }
}

// Import users from CSV
export function importUsersToList(listType: UserListType, csvData: string, adminId: string): number {
  try {
    const rows = csvData.split("\n")
    const headers = rows[0].split(",")

    const userIdIndex = headers.findIndex((h) => h.trim().toLowerCase() === "userid")
    const usernameIndex = headers.findIndex((h) => h.trim().toLowerCase() === "username")
    const emailIndex = headers.findIndex((h) => h.trim().toLowerCase() === "email")
    const reasonIndex = headers.findIndex((h) => h.trim().toLowerCase() === "reason")

    if (userIdIndex === -1 || usernameIndex === -1 || emailIndex === -1) {
      throw new Error("CSV must contain userId, username, and email columns")
    }

    const currentList = getUsersFromList(listType)
    const existingUserIds = new Set(currentList.map((user) => user.userId))
    let addedCount = 0

    const newUsers: UserListItem[] = []

    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue

      const columns = rows[i].split(",")
      const userId = columns[userIdIndex].trim()

      if (!userId || existingUserIds.has(userId)) continue

      newUsers.push({
        userId,
        username: columns[usernameIndex].trim(),
        email: columns[emailIndex].trim(),
        reason: reasonIndex !== -1 ? columns[reasonIndex].trim() : "",
        addedAt: Date.now(),
        addedBy: adminId,
      })

      addedCount++
    }

    if (newUsers.length > 0) {
      const updatedList = [...currentList, ...newUsers]
      localStorage.setItem(`kushl_${listType}_users`, JSON.stringify(updatedList))
    }

    return addedCount
  } catch (error) {
    console.error(`Error importing users to ${listType} list:`, error)
    return 0
  }
}

// Export users to CSV
export function exportUsersFromList(listType: UserListType): string {
  try {
    const users = getUsersFromList(listType)
    if (users.length === 0) {
      return "userId,username,email,addedAt,addedBy,reason"
    }

    const headers = "userId,username,email,addedAt,addedBy,reason"
    const rows = users.map((user) => {
      const addedDate = new Date(user.addedAt).toISOString()
      return `${user.userId},${user.username},${user.email},${addedDate},${user.addedBy},${user.reason}`
    })

    return [headers, ...rows].join("\n")
  } catch (error) {
    console.error(`Error exporting users from ${listType} list:`, error)
    return ""
  }
}

// Search users in a list
export function searchUsersInList(listType: UserListType, query: string): UserListItem[] {
  try {
    if (!query) return getUsersFromList(listType)

    const list = getUsersFromList(listType)
    const lowerQuery = query.toLowerCase()

    return list.filter(
      (user) =>
        user.userId.toLowerCase().includes(lowerQuery) ||
        user.username.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery),
    )
  } catch (error) {
    console.error(`Error searching users in ${listType} list:`, error)
    return []
  }
}

// Helper functions
const getStorageKeyForList = (listType: UserListType): string => {
  switch (listType) {
    case "banned":
      return BANNED_USERS_KEY
    case "discouraged":
      return DISCOURAGED_USERS_KEY
    case "encouraged":
      return ENCOURAGED_USERS_KEY
    default:
      return BANNED_USERS_KEY
  }
}

const saveUserList = (users: UserListItem[], listType: UserListType): void => {
  if (typeof window === "undefined") return

  const storageKey = getStorageKeyForList(listType)
  localStorage.setItem(storageKey, JSON.stringify(users))
}
