import { getProjects, type Task } from "./task-management"

// Get all completed tasks for a student
export function getStudentCompletedTasks(studentId: string): Task[] {
  try {
    const allProjects = getProjects("all") || []
    const completedTasks: Task[] = []

    allProjects.forEach((project) => {
      project.sprints.forEach((sprint) => {
        sprint.campaigns.forEach((campaign) => {
          campaign.tasks.forEach((task) => {
            if (task.assigneeId === studentId && task.status === "completed") {
              completedTasks.push({
                ...task,
                projectName: project.name,
                projectId: project.id,
                ownerId: project.ownerId,
                category: task.category || project.category || "General",
              })
            }
          })
        })
      })
    })

    return completedTasks
  } catch (error) {
    console.error("Error getting completed tasks:", error)
    return []
  }
}

// Get total earnings for a student from completed tasks
export function getStudentTotalEarnings(studentId: string): number {
  try {
    const completedTasks = getStudentCompletedTasks(studentId)
    return completedTasks.reduce((sum, task) => sum + (Number(task.price) || 0), 0)
  } catch (error) {
    console.error("Error calculating total earnings:", error)
    return 0
  }
}

// Get task categories for a student
export function getStudentTaskCategories(studentId: string): { [key: string]: number } {
  try {
    const completedTasks = getStudentCompletedTasks(studentId)
    const categories: { [key: string]: number } = {}

    completedTasks.forEach((task) => {
      const category = task.category || "General"
      categories[category] = (categories[category] || 0) + 1
    })

    return categories
  } catch (error) {
    console.error("Error getting task categories:", error)
    return {}
  }
}

// Get unique employers for a student's completed tasks
export function getStudentEmployers(studentId: string): string[] {
  try {
    const completedTasks = getStudentCompletedTasks(studentId)
    const employerIds = new Set<string>()

    completedTasks.forEach((task) => {
      if (task.ownerId) {
        employerIds.add(task.ownerId)
      }
    })

    return Array.from(employerIds)
  } catch (error) {
    console.error("Error getting student employers:", error)
    return []
  }
}

// Alias for backward compatibility
export const getUserById = getUserById
