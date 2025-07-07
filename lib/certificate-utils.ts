import { findUserById, getUserById } from "./storage"

// Helper function to get all tasks for a student
export async function getStudentTasks(studentId: string) {
  try {
    // In a real app, this would be a database query
    // For now, we'll simulate by getting tasks from localStorage
    const tasksJson = localStorage.getItem("tasks")
    const projectsJson = localStorage.getItem("kushl_projects")

    const tasks = tasksJson ? JSON.parse(tasksJson) : []
    const projects = projectsJson ? JSON.parse(projectsJson) : []

    const studentTasks = []

    // Check standalone tasks
    tasks.forEach((task) => {
      if (task.assigneeId === studentId || task.assignedTo === studentId) {
        studentTasks.push({
          ...task,
          source: "standalone",
        })
      }
    })

    // Check project tasks
    projects.forEach((project) => {
      if (project.sprints) {
        project.sprints.forEach((sprint) => {
          if (sprint.campaigns) {
            sprint.campaigns.forEach((campaign) => {
              if (campaign.tasks) {
                campaign.tasks.forEach((task) => {
                  if (task.assigneeId === studentId || task.assignedTo === studentId) {
                    // Check if this task is already in the list (to avoid duplicates)
                    const isDuplicate = studentTasks.some((t) => t.id === task.id)
                    if (!isDuplicate) {
                      studentTasks.push({
                        ...task,
                        projectId: project.id,
                        projectName: project.name,
                        ownerId: project.ownerId,
                        category: task.category || project.category || "General",
                        source: "project",
                      })
                    }
                  }
                })
              }
            })
          }
        })
      }
    })

    return studentTasks
  } catch (error) {
    console.error("Error getting student tasks:", error)
    return []
  }
}

// Get completed tasks for a student
export async function getStudentCompletedTasks(studentId: string) {
  const allTasks = await getStudentTasks(studentId)
  return allTasks.filter((task) => task.status === "completed")
}

// Get task categories with counts
export async function getStudentTaskCategories(studentId: string) {
  const completedTasks = await getStudentCompletedTasks(studentId)
  const categories = {}

  completedTasks.forEach((task) => {
    const category = task.category || "General"
    categories[category] = (categories[category] || 0) + 1
  })

  return categories
}

// Get unique employers with details
export async function getStudentEmployers(studentId: string) {
  const completedTasks = await getStudentCompletedTasks(studentId)
  const employerIds = new Set()

  completedTasks.forEach((task) => {
    if (task.ownerId) {
      employerIds.add(task.ownerId)
    }
  })

  const employers = await Promise.all(
    Array.from(employerIds).map(async (id) => {
      const employer = await getUserById(id)
      return employer
    }),
  )

  return employers.filter(Boolean)
}

// Calculate total earnings
export async function getStudentTotalEarnings(studentId: string) {
  const completedTasks = await getStudentCompletedTasks(studentId)
  return completedTasks.reduce((sum, task) => sum + (Number(task.price) || 0), 0)
}

// Calculate success rate
export async function getStudentSuccessRate(studentId: string) {
  const allTasks = await getStudentTasks(studentId)
  const completedTasks = allTasks.filter((task) => task.status === "completed")

  if (allTasks.length === 0) return 0
  return (completedTasks.length / allTasks.length) * 100
}

// Get certificate data for a student
export async function getStudentCertificateData(studentId: string) {
  try {
    const student = await findUserById(studentId)
    if (!student) {
      throw new Error("Student not found")
    }

    const completedTasks = await getStudentCompletedTasks(studentId)
    const categories = await getStudentTaskCategories(studentId)
    const employers = await getStudentEmployers(studentId)
    const totalEarnings = await getStudentTotalEarnings(studentId)
    const successRate = await getStudentSuccessRate(studentId)

    return {
      student,
      completedTasks,
      categories,
      employers,
      totalEarnings,
      successRate,
      certificateId: studentId,
      issueDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    }
  } catch (error) {
    console.error("Error getting certificate data:", error)
    throw error
  }
}
