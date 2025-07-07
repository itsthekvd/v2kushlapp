import { getUsers } from "./storage"
import { getProjects, getAllPublishedTasks } from "./task-management"
import type { Task } from "./task-management"

export interface PlatformStatistics {
  totalEmployers: number
  totalStudents: number
  totalTasks: number
  completedTasks: number
  averagePayout: number
  totalPayouts: number
  averageTimelineMessages: number
  totalTimelineMessages: number
  averageCompletionTimeHours: number
  taskSuccessRate: number
  activeProjects: number
}

export const calculatePlatformStatistics = (): PlatformStatistics => {
  // Get all users
  const users = getUsers()
  const employers = users.filter((user) => user.userType === "employer")
  const students = users.filter((user) => user.userType === "student")

  // Get all projects and tasks
  const allProjects = getProjects("all")
  const publishedTasks = getAllPublishedTasks()

  // Calculate task statistics
  let completedTasks = 0
  let totalPayouts = 0
  let totalTimelineMessages = 0
  let totalCompletionTimeHours = 0
  let tasksWithCompletionTime = 0

  publishedTasks.forEach((task) => {
    // Count completed tasks
    if (task.status === "completed") {
      completedTasks++

      // Calculate completion time if available
      if (task.completedAt && task.publishedAt) {
        const completionTimeHours = (task.completedAt - task.publishedAt) / (1000 * 60 * 60)
        totalCompletionTimeHours += completionTimeHours
        tasksWithCompletionTime++
      }
    }

    // Sum up payouts
    if (task.price) {
      totalPayouts += task.price
    }

    // Count timeline messages
    if (task.timelineMessages) {
      totalTimelineMessages += task.timelineMessages.length
    }
  })

  // Calculate averages
  const averagePayout = publishedTasks.length > 0 ? totalPayouts / publishedTasks.length : 0
  const averageTimelineMessages = publishedTasks.length > 0 ? totalTimelineMessages / publishedTasks.length : 0
  const averageCompletionTimeHours =
    tasksWithCompletionTime > 0 ? totalCompletionTimeHours / tasksWithCompletionTime : 0
  const taskSuccessRate = publishedTasks.length > 0 ? (completedTasks / publishedTasks.length) * 100 : 0

  // Count active projects (with at least one published task)
  const activeProjects = allProjects.filter((project) => {
    let hasPublishedTask = false
    project.sprints.forEach((sprint) => {
      sprint.campaigns.forEach((campaign) => {
        if (campaign.tasks.some((task) => task.isPublished)) {
          hasPublishedTask = true
        }
      })
    })
    return hasPublishedTask
  }).length

  return {
    totalEmployers: employers.length,
    totalStudents: students.length,
    totalTasks: publishedTasks.length,
    completedTasks,
    averagePayout,
    totalPayouts,
    averageTimelineMessages,
    totalTimelineMessages,
    averageCompletionTimeHours,
    taskSuccessRate,
    activeProjects,
  }
}

// Get featured tasks (most recent published tasks)
export const getFeaturedTasks = (limit = 6): Task[] => {
  const publishedTasks = getAllPublishedTasks()

  // Sort by publishedAt (most recent first)
  const sortedTasks = [...publishedTasks].sort((a, b) => {
    const dateA = a.publishedAt || 0
    const dateB = b.publishedAt || 0
    return dateB - dateA
  })

  return sortedTasks.slice(0, limit)
}

// Get tasks by category
export const getTasksByCategory = (category: string, limit = 4): Task[] => {
  const publishedTasks = getAllPublishedTasks()

  // Filter by category and sort by publishedAt
  const filteredTasks = publishedTasks
    .filter((task) => task.category === category)
    .sort((a, b) => {
      const dateA = a.publishedAt || 0
      const dateB = b.publishedAt || 0
      return dateB - dateA
    })

  return filteredTasks.slice(0, limit)
}

// Get popular categories (categories with most tasks)
export const getPopularCategories = (limit = 6): { name: string; count: number }[] => {
  const publishedTasks = getAllPublishedTasks()

  // Count tasks by category
  const categoryCounts: Record<string, number> = {}

  publishedTasks.forEach((task) => {
    if (task.category) {
      categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1
    }
  })

  // Convert to array and sort by count
  const categories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return categories.slice(0, limit)
}
