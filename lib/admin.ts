// Admin utility functions for KushL app

import { generateUserId, getUsers, getPayments } from "./storage"
import type { AdminProfile } from "./storage"

// Create a super admin user
export const createSuperAdmin = (fullName: string, email: string, whatsappNumber: string): AdminProfile => {
  return {
    id: generateUserId(),
    fullName,
    email,
    whatsappNumber,
    userType: "admin",
    adminLevel: "super",
    isProfileComplete: true,
    lastActiveDate: Date.now(),
    permissions: {
      manageUsers: true,
      managePayments: true,
      viewAnalytics: true,
      manageContent: true,
      manageSettings: true,
    },
  }
}

// Create a manager admin user
export const createManagerAdmin = (fullName: string, email: string, whatsappNumber: string): AdminProfile => {
  return {
    id: generateUserId(),
    fullName,
    email,
    whatsappNumber,
    userType: "admin",
    adminLevel: "manager",
    isProfileComplete: true,
    lastActiveDate: Date.now(),
    permissions: {
      manageUsers: true,
      managePayments: true,
      viewAnalytics: true,
      manageContent: false,
      manageSettings: false,
    },
  }
}

// Create a support admin user
export const createSupportAdmin = (fullName: string, email: string, whatsappNumber: string): AdminProfile => {
  return {
    id: generateUserId(),
    fullName,
    email,
    whatsappNumber,
    userType: "admin",
    adminLevel: "support",
    isProfileComplete: true,
    lastActiveDate: Date.now(),
    permissions: {
      manageUsers: false,
      managePayments: false,
      viewAnalytics: true,
      manageContent: false,
      manageSettings: false,
    },
  }
}

// Create an admin user with the specified level
export const createAdminUser = (
  fullName: string,
  email: string,
  whatsappNumber: string,
  adminLevel: "super" | "manager" | "support",
): AdminProfile => {
  switch (adminLevel) {
    case "super":
      return createSuperAdmin(fullName, email, whatsappNumber)
    case "manager":
      return createManagerAdmin(fullName, email, whatsappNumber)
    case "support":
      return createSupportAdmin(fullName, email, whatsappNumber)
    default:
      return createSupportAdmin(fullName, email, whatsappNumber)
  }
}

// Check if a user has a specific admin permission
export const hasAdminPermission = (
  user: any,
  permission: "manageUsers" | "managePayments" | "viewAnalytics" | "manageContent" | "manageSettings",
): boolean => {
  if (!user || user.userType !== "admin") {
    return false
  }

  return !!user.permissions?.[permission]
}

// User list management functions

// Check if a user is in a specific list
export const isUserInList = (
  email: string,
  whatsappNumber: string,
  listType: "banned" | "discouraged" | "encouraged",
): boolean => {
  // In a real implementation, this would check against a database
  // For now, we'll return a mock result
  return false
}

// Apply effects based on user list
export const applyUserListEffects = (
  user: any,
): { isBanned: boolean; isDiscouraged: boolean; isEncouraged: boolean } => {
  // In a real implementation, this would check against the lists and apply effects
  // For now, we'll return default values
  return {
    isBanned: false,
    isDiscouraged: false,
    isEncouraged: false,
  }
}

// Platform notification management

export interface PlatformNotification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  showToEmployers: boolean
  showToStudents: boolean
  showToGuests: boolean
  active: boolean
  startDate: number
  endDate: number
}

// Get all notifications
export const getNotifications = async (): Promise<PlatformNotification[]> => {
  // In a real implementation, this would fetch from a database
  // For now, we'll return mock notifications
  const now = Date.now()

  return [
    {
      id: "1",
      title: "Welcome to KushL",
      message: "Thank you for joining our platform. We're excited to have you here!",
      type: "info",
      showToEmployers: true,
      showToStudents: true,
      showToGuests: true,
      active: true,
      startDate: now - 7 * 24 * 60 * 60 * 1000,
      endDate: now + 7 * 24 * 60 * 60 * 1000,
    },
    {
      id: "2",
      title: "New Feature: Enhanced Task Management",
      message: "We've added new features to make task management easier. Check it out!",
      type: "success",
      showToEmployers: true,
      showToStudents: false,
      showToGuests: false,
      active: true,
      startDate: now - 3 * 24 * 60 * 60 * 1000,
      endDate: now + 14 * 24 * 60 * 60 * 1000,
    },
    {
      id: "3",
      title: "Scheduled Maintenance",
      message: "The platform will be undergoing maintenance on Sunday from 2-4 AM IST.",
      type: "warning",
      showToEmployers: true,
      showToStudents: true,
      showToGuests: true,
      active: true,
      startDate: now - 1 * 24 * 60 * 60 * 1000,
      endDate: now + 3 * 24 * 60 * 60 * 1000,
    },
  ]
}

// Get active notifications for a specific user type
export const getActiveNotifications = (
  userType: "employer" | "student" | "guest" | null,
): Promise<PlatformNotification[]> => {
  return new Promise(async (resolve) => {
    const allNotifications = await getNotifications()
    const now = Date.now()

    // Filter notifications based on user type and active status
    const activeNotifications = allNotifications.filter((notification) => {
      if (!notification.active) return false
      if (now < notification.startDate || now > notification.endDate) return false

      if (userType === "employer") return notification.showToEmployers
      if (userType === "student") return notification.showToStudents
      if (userType === "guest" || userType === null) return notification.showToGuests

      return false
    })

    resolve(activeNotifications)
  })
}

// Add a new notification
export const addNotification = async (
  notification: Omit<PlatformNotification, "id">,
): Promise<{ success: boolean; message?: string; notification?: PlatformNotification }> => {
  try {
    // In a real implementation, this would save to a database
    const newNotification: PlatformNotification = {
      id: generateUserId(),
      ...notification,
    }

    return { success: true, notification: newNotification }
  } catch (error) {
    console.error("Error adding notification:", error)
    return { success: false, message: "Failed to add notification" }
  }
}

// Update an existing notification
export const updateNotification = async (
  id: string,
  updates: Partial<PlatformNotification>,
): Promise<{ success: boolean; message?: string }> => {
  try {
    // In a real implementation, this would update in a database
    return { success: true }
  } catch (error) {
    console.error("Error updating notification:", error)
    return { success: false, message: "Failed to update notification" }
  }
}

// Delete a notification
export const deleteNotification = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // In a real implementation, this would delete from a database
    return { success: true }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return { success: false, message: "Failed to delete notification" }
  }
}

// SOP management

export interface StandardOperatingProcedure {
  id: string
  category: string
  content: string
}

// Get SOP for a specific category
export const getSOPForCategory = (category: string): StandardOperatingProcedure | null => {
  // In a real implementation, this would fetch from a database
  // For now, we'll return a mock SOP if the category matches
  if (category === "Website Development") {
    return {
      id: "1",
      category: "Website Development",
      content:
        "1. Review client requirements\n2. Create wireframes\n3. Get approval\n4. Develop website\n5. Test functionality\n6. Deploy to production",
    }
  }

  return null
}

// Add a popup notification
export const addPopup = (popup: any, userId: string): any => {
  // In a real implementation, this would save to a database
  return {
    id: generateUserId(),
    ...popup,
    createdBy: userId,
    createdAt: Date.now(),
  }
}

// Update a popup notification
export const updatePopup = (popup: any): boolean => {
  // In a real implementation, this would update in a database
  return true
}

// Delete a popup notification
export const deletePopup = (popupId: string): boolean => {
  // In a real implementation, this would delete from a database
  return true
}

// Get all popups
export const getPopups = (): any[] => {
  // In a real implementation, this would fetch from a database
  return []
}

// Activity logs

// Get activity logs
export const getActivityLogs = async (since: number): Promise<any[]> => {
  // In a real implementation, this would fetch from a database
  // For now, we'll return mock logs
  const now = Date.now()

  return [
    {
      id: "1",
      timestamp: now - 1 * 60 * 60 * 1000,
      userId: "admin1",
      userName: "Admin User",
      type: "admin",
      message: "Updated system settings",
    },
    {
      id: "2",
      timestamp: now - 2 * 60 * 60 * 1000,
      userId: "user1",
      userName: "John Doe",
      type: "auth",
      message: "User logged in",
    },
    {
      id: "3",
      timestamp: now - 3 * 60 * 60 * 1000,
      userId: "user2",
      userName: "Jane Smith",
      type: "task",
      message: "Created new task: Website Development",
    },
    {
      id: "4",
      timestamp: now - 4 * 60 * 60 * 1000,
      userId: "user3",
      userName: "Bob Johnson",
      type: "payment",
      message: "Payment processed for task #12345",
    },
    {
      id: "5",
      timestamp: now - 5 * 60 * 60 * 1000,
      userId: "system",
      userName: "System",
      type: "system",
      message: "Scheduled maintenance completed",
    },
    {
      id: "6",
      timestamp: now - 6 * 60 * 60 * 1000,
      userId: "admin2",
      userName: "Super Admin",
      type: "user",
      message: "User account blocked: spammer@example.com",
    },
    {
      id: "7",
      timestamp: now - 7 * 60 * 60 * 1000,
      userId: "user4",
      userName: "Alice Williams",
      type: "task",
      message: "Task marked as completed: Logo Design",
    },
    {
      id: "8",
      timestamp: now - 8 * 60 * 60 * 1000,
      userId: "user5",
      userName: "Charlie Brown",
      type: "auth",
      message: "Password reset requested",
    },
    {
      id: "9",
      timestamp: now - 9 * 60 * 60 * 1000,
      userId: "admin1",
      userName: "Admin User",
      type: "admin",
      message: "Added new notification: System Update",
    },
    {
      id: "10",
      timestamp: now - 10 * 60 * 60 * 1000,
      userId: "system",
      userName: "System",
      type: "system",
      message: "Database backup completed",
    },
  ].filter((log) => log.timestamp >= since)
}

// System health

// Get system health data
export const getSystemHealth = async (): Promise<any> => {
  // In a real implementation, this would fetch actual system metrics
  // For now, we'll return mock data

  return {
    storage: {
      total: 1000,
      used: 350,
      free: 650,
      percentUsed: 35,
    },
    memory: {
      total: 8192,
      used: 4096,
      free: 4096,
      percentUsed: 50,
    },
    cpu: {
      cores: 4,
      load: 25,
      temperature: 45,
    },
    components: [
      {
        name: "Database",
        type: "database",
        status: "healthy",
        lastCheck: "2023-06-15 14:30:22",
        details: "Connection pool: 10/20",
      },
      {
        name: "File Storage",
        type: "storage",
        status: "healthy",
        lastCheck: "2023-06-15 14:30:22",
        details: "Read/Write operations normal",
      },
      {
        name: "Web Server",
        type: "server",
        status: "healthy",
        lastCheck: "2023-06-15 14:30:22",
        details: "Response time: 120ms",
      },
      {
        name: "Authentication Service",
        type: "security",
        status: "healthy",
        lastCheck: "2023-06-15 14:30:22",
        details: "JWT verification working",
      },
      {
        name: "Task Processor",
        type: "processor",
        status: "warning",
        lastCheck: "2023-06-15 14:30:22",
        details: "Queue backlog: 15 items",
      },
    ],
    alerts: [
      {
        title: "Task Processor Queue Backlog",
        message: "The task processor has a backlog of 15 items. Consider scaling up the processor.",
        severity: "warning",
        timestamp: "2023-06-15 14:25:10",
      },
      {
        title: "High CPU Temperature",
        message: "CPU temperature is approaching threshold (45°C). Monitor for further increases.",
        severity: "warning",
        timestamp: "2023-06-15 14:20:05",
      },
    ],
  }
}

// Backup and restore

// Backup system data
export const backupData = async (): Promise<{ success: boolean; message?: string; data?: any }> => {
  try {
    // In a real implementation, this would fetch all data from the database
    // For now, we'll create a mock backup with some data

    const users = getUsers()
    const payments = getPayments()

    const backupData = {
      timestamp: Date.now(),
      version: "1.0",
      data: {
        users,
        payments,
        // Add other data as needed
      },
    }

    return { success: true, data: backupData }
  } catch (error) {
    console.error("Error creating backup:", error)
    return { success: false, message: "Failed to create backup" }
  }
}

// Restore system data
export const restoreData = async (backupData: any): Promise<{ success: boolean; message?: string }> => {
  try {
    // In a real implementation, this would restore all data to the database
    // For now, we'll just return success

    // Validate backup data
    if (!backupData || !backupData.timestamp || !backupData.version || !backupData.data) {
      return { success: false, message: "Invalid backup data" }
    }

    // Restore users
    if (backupData.data.users) {
      // In a real implementation, this would restore users to the database
      console.log(`Restoring ${backupData.data.users.length} users...`)
    }

    // Restore payments
    if (backupData.data.payments) {
      // In a real implementation, this would restore payments to the database
      console.log(`Restoring ${backupData.data.payments.length} payments...`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error restoring backup:", error)
    return { success: false, message: "Failed to restore backup" }
  }
}

// Add an admin user to localStorage for testing
export const addAdminUserToLocalStorage = (adminLevel: "super" | "manager" | "support" = "super"): void => {
  try {
    const adminUser = createAdminUser("Admin User", "admin@kushl.com", "+919876543210", adminLevel)

    // Add the admin user to localStorage
    const users = getUsers()

    // Check if admin user already exists
    const existingAdminIndex = users.findIndex((u) => u.email === adminUser.email)

    if (existingAdminIndex !== -1) {
      // Update existing admin
      users[existingAdminIndex] = adminUser
    } else {
      // Add new admin
      users.push(adminUser)
    }

    // Save users to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("kushl_users", JSON.stringify(users))
    }

    console.log(`Admin user created: ${adminUser.email}`)
  } catch (error) {
    console.error("Error adding admin user to localStorage:", error)
  }
}
