export type TaskStatus =
  | "to_do"
  | "doing"
  | "done"
  | "recurring_daily"
  | "recurring_weekly"
  | "recurring_monthly"
  | "blocked"
  | "checklist_library"
  | "credentials_library"
  | "brand_brief"
  | "resource_library"
  | "draft"
  | "published"
  | "in_progress"
  | "review"
  | "completed"
  | "archived"

export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskView = "kanban" | "list" | "calendar" | "matrix"
export type RecurrenceType = "daily" | "weekly" | "monthly" | null

// Add recurrence history interface
export interface RecurrenceHistory {
  completedAt: number
  completedBy: string
  nextDueDate: number
}

// Add edit history interface
export interface EditHistory {
  userId: string
  userName: string
  timestamp: number
  action?: string // Description of what was changed
}

// Add timeline message interface
export interface TimelineMessage {
  id: string
  userId: string
  userName: string
  userType: "employer" | "student"
  content: string
  timestamp: number
  isSystemMessage: boolean
  isDeleted?: boolean
  deletedAt?: number
  relatedToMessageId?: string
  edited?: boolean
  editedAt?: number
}

// Add assignment interface
export interface TaskAssignment {
  studentId: string
  studentEmail: string
  studentName: string
  assignedAt: number
  status: "active" | "completed" | "reassigned"
}

// Add application interface
export interface TaskApplication {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  note: string
  createdAt: number
  updatedAt: number
  status: "pending" | "approved" | "rejected"
}

// Add review interfaces
export interface Review {
  id: string
  reviewerId: string
  reviewerName: string
  reviewerType: "employer" | "student"
  recipientId: string
  recipientName: string
  taskId: string
  taskTitle: string
  rating: number
  comment: string
  createdAt: number
}

export interface Project {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
  ownerId: string
  sprints: Sprint[]
}

export interface Sprint {
  id: string
  name: string
  description?: string
  startDate: number
  endDate: number
  projectId: string
  campaigns: Campaign[]
}

export interface Campaign {
  id: string
  name: string
  description?: string
  startDate: number
  endDate: number
  sprintId: string
  tasks: Task[]
}

// Add label interface
export interface TaskLabel {
  id: string
  name: string
  color: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  campaignId: string
  createdAt: number
  updatedAt: number
  dueDate?: number
  assigneeId?: string
  videoUrl?: string
  isPublished: boolean
  publishedAt?: number
  completedAt?: number
  skills?: string[]
  estimatedHours?: number
  // Add category and pricing
  category?: string
  price?: number
  // Add standard operating procedure
  standardOperatingProcedure?: string
  // Add edit history
  editHistory?: EditHistory[]
  // Add timeline settings and messages
  autoPostToTimeline?: boolean
  timelineMessages?: TimelineMessage[]
  // Add assignment information
  assignment?: TaskAssignment
  // Update comments structure
  comments?: {
    id: string
    userId: string
    userName: string
    text: string
    createdAt: number
  }[]
  compensation?: {
    amount: number
    currency: string
    type: "fixed" | "hourly"
  }
  attachments?: {
    id: string
    name: string
    url: string
    type: string
  }[]
  checklists?: {
    id: string
    title: string
    items: {
      id: string
      text: string
      completed: boolean
    }[]
  }[]
  applications?: TaskApplication[]
  employerReview?: Review
  studentReview?: Review
  // Add labels
  labels?: TaskLabel[]
  // Add fields for special columns
  checklistItems?: {
    id: string
    text: string
    completed: boolean
  }[]
  credentials?: {
    id: string
    service: string
    username: string
    password: string
    notes?: string
  }[]
  brandBrief?: {
    brandName: string
    clientName?: string
    brandColors: string[]
    brandFonts: string[]
    brandVoice: string
    targetAudience: string
    keyMessages: string[]
  }
  resources?: {
    id: string
    name: string
    url: string
    type: string
    description?: string
  }[]
  // Add recurrence properties
  recurrenceType?: RecurrenceType
  lastCompletedAt?: number
  nextDueDate?: number
  recurrenceHistory?: RecurrenceHistory[]
  isRecurringCompleted?: boolean
  detailsPostedToTimeline?: boolean
  assignedTo?: string
}

// Storage keys
const PROJECTS_KEY = "kushl_projects"

// Helper functions
export const saveProjects = (projects: Project[]): void => {
  if (typeof window !== "undefined") {
    try {
      const projectsJson = JSON.stringify(projects)
      localStorage.setItem(PROJECTS_KEY, projectsJson)
    } catch (error) {
      console.error("Error saving projects to localStorage:", error)
    }
  }
}

export const getProjects = (userId: string): Project[] => {
  if (typeof window !== "undefined") {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY)
      if (projects) {
        const allProjects: Project[] = JSON.parse(projects)
        // If userId is "all", return all projects, otherwise filter by owner
        return userId === "all" ? allProjects : allProjects.filter((project) => project.ownerId === userId)
      }
    } catch (error) {
      console.error("Error getting projects from localStorage:", error)
      // Return empty array on error instead of undefined
      return []
    }
  }
  return []
}

export const getProject = (projectId: string): Project | undefined => {
  if (!projectId || typeof window === "undefined") {
    return undefined
  }

  try {
    const projects = localStorage.getItem(PROJECTS_KEY)
    if (projects) {
      const allProjects: Project[] = JSON.parse(projects)
      const project = allProjects.find((project) => project.id === projectId)
      return project
    }
  } catch (error) {
    console.error(`Error getting project ${projectId} from localStorage:`, error)
  }
  return undefined
}

export const addProject = (project: Project): void => {
  const projects = getProjects("all")
  projects.push(project)
  saveProjects(projects)
}

export const updateProject = (updatedProject: Project): void => {
  try {
    const projects = getProjects("all")
    const index = projects.findIndex((p) => p.id === updatedProject.id)

    if (index !== -1) {
      projects[index] = updatedProject
      saveProjects(projects)
    } else {
      console.error("Project not found for update:", updatedProject.id)
    }
  } catch (error) {
    console.error("Error updating project:", error)
  }
}

export const deleteProject = (projectId: string): void => {
  const projects = getProjects("all")
  const filteredProjects = projects.filter((p) => p.id !== projectId)
  saveProjects(filteredProjects)
}

export function getAllPublishedTasks(): any[] {
  const projects = getProjects("all")
  const publishedTasks: Task[] = []

  projects.forEach((project) => {
    project.sprints.forEach((sprint) => {
      sprint.campaigns.forEach((campaign) => {
        campaign.tasks.forEach((task) => {
          if (task.isPublished) {
            publishedTasks.push(task)
          }
        })
      })
    })
  })

  return publishedTasks
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// YouTube video utilities
export const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return ""

  // Extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`
  }

  return ""
}

// Enhance the YouTube URL validation function to be more robust
export const isValidYouTubeUrl = (url: string): boolean => {
  if (!url) return false

  // Trim the URL to handle whitespace
  const trimmedUrl = url.trim()

  // Check if it's a valid URL first
  try {
    new URL(trimmedUrl)
  } catch (e) {
    return false
  }

  // Check for common YouTube URL patterns
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/
  if (!youtubeRegex.test(trimmedUrl)) {
    return false
  }

  // Extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = trimmedUrl.match(regExp)

  // Valid YouTube video IDs are 11 characters long
  return !!(match && match[2] && match[2].length === 11)
}

// Add a function to get a task by ID
export function getTaskById(taskId: string): any {
  const projects = getProjects("all")

  for (const project of projects) {
    for (const sprint of project.sprints) {
      for (const campaign of sprint.campaigns) {
        const task = campaign.tasks.find((task) => task.id === taskId)
        if (task) return task
      }
    }
  }

  return undefined
}

// Add a function to add a task to a specific campaign
export const addTaskToCampaign = (
  projectId: string,
  sprintId: string,
  campaignId: string,
  task: Task,
  userId?: string,
  userName?: string,
): boolean => {
  try {
    // Get the project
    const project = getProject(projectId)
    if (!project) {
      console.error("Project not found:", projectId)
      return false
    }

    // Find the sprint
    const sprintIndex = project.sprints.findIndex((s) => s.id === sprintId)
    if (sprintIndex === -1) {
      console.error("Sprint not found:", sprintId)
      return false
    }

    // Find the campaign
    const campaignIndex = project.sprints[sprintIndex].campaigns.findIndex((c) => c.id === campaignId)
    if (campaignIndex === -1) {
      console.error("Campaign not found:", campaignId)
      return false
    }

    // Add the task to the campaign
    project.sprints[sprintIndex].campaigns[campaignIndex].tasks.push(task)

    // Update the project
    updateProject(project)

    console.log("Task added successfully:", task.title)
    return true
  } catch (error) {
    console.error("Error adding task to campaign:", error)
    return false
  }
}

// This is a helper function to create a task
export async function createTask(
  projectId: string,
  sprintId: string,
  campaignId: string,
  title: string,
  description: string,
  status: string,
  priority: string,
  dueDate: number | null,
  userId: string,
  userName: string,
  recurring?: { type: "daily" | "weekly" | "monthly" },
) {
  try {
    // Generate a unique ID for the task
    const taskId = generateId()

    // Create the task object
    const task = {
      id: taskId,
      title,
      description,
      status,
      priority,
      campaignId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dueDate,
      isPublished: false,
      publishedAt: undefined,
      createdBy: userId,
      creatorName: userName,
      recurring: recurring
        ? {
            type: recurring.type,
            lastCompleted: null,
            nextReset: null,
          }
        : undefined,
    }

    // Add the task to the campaign
    const success = await addTaskToCampaign(projectId, sprintId, campaignId, task, userId, userName)

    if (success) {
      return taskId
    } else {
      throw new Error("Failed to add task to campaign")
    }
  } catch (error) {
    console.error("Error creating task:", error)
    return null
  }
}

export const getAllTasks = (project: Project | undefined): Task[] => {
  if (!project) return []

  try {
    const allTasks: Task[] = []
    project.sprints.forEach((sprint) => {
      sprint.campaigns.forEach((campaign) => {
        allTasks.push(...campaign.tasks)
      })
    })
    return allTasks
  } catch (error) {
    console.error("Error getting all tasks:", error)
    return []
  }
}

// Function to update task status
export function updateTaskStatus(taskId: string, status: string): boolean {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            campaign.tasks[taskIndex].status = status as TaskStatus
            campaign.tasks[taskIndex].updatedAt = Date.now()
            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error updating task status:", error)
    return false
  }
}

// Function to update task priority
export const updateTaskPriority = async (
  taskId: string,
  newPriority: TaskPriority,
  userId?: string,
  userName?: string,
): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            campaign.tasks[taskIndex].priority = newPriority
            campaign.tasks[taskIndex].updatedAt = Date.now()
            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error updating task priority:", error)
    return false
  }
}

// Function to get sprint and campaign names for a task
export const getSprintAndCampaignNames = (
  taskId: string,
): { projectName?: string; sprintName?: string; projectId?: string } => {
  try {
    const projects = getProjects("all")

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const task = campaign.tasks.find((task) => task.id === taskId)

          if (task) {
            return {
              projectName: project.name,
              sprintName: sprint.name,
              projectId: project.id,
            }
          }
        }
      }
    }

    return {}
  } catch (error) {
    console.error("Error getting sprint and campaign names:", error)
    return {}
  }
}

// Add this function to update a task with any fields
export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
  userId?: string,
  userName?: string,
): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            campaign.tasks[taskIndex] = {
              ...campaign.tasks[taskIndex],
              ...updates,
              updatedAt: Date.now(),
            }
            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error updating task:", error)
    return false
  }
}

// Add a function to add a comment to a task
export const addCommentToTask = async (
  taskId: string,
  comment: string,
  userId: string,
  userName: string,
): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            // Initialize comments array if it doesn't exist
            if (!campaign.tasks[taskIndex].comments) {
              campaign.tasks[taskIndex].comments = []
            }

            // Add the new comment
            campaign.tasks[taskIndex].comments.push({
              id: generateId(),
              userId,
              userName,
              text: comment,
              createdAt: Date.now(),
            })

            // Update the task's updatedAt timestamp
            campaign.tasks[taskIndex].updatedAt = Date.now()

            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error adding comment to task:", error)
    return false
  }
}

// Toggle the publish status of a task
export const toggleTaskPublishStatus = async (taskId: string, userId: string, userName: string): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            campaign.tasks[taskIndex].isPublished = !campaign.tasks[taskIndex].isPublished
            campaign.tasks[taskIndex].updatedAt = Date.now()
            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error toggling task publish status:", error)
    return false
  }
}

// Toggle the auto-post to timeline setting
export const toggleAutoPostToTimeline = async (taskId: string, userId: string, userName: string): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            campaign.tasks[taskIndex].autoPostToTimeline = !campaign.tasks[taskIndex].autoPostToTimeline
            campaign.tasks[taskIndex].updatedAt = Date.now()
            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error toggling auto-post to timeline setting:", error)
    return false
  }
}

// Reassign a task (remove current assignment and republish)
export const reassignTask = async (
  taskId: string,
  reason: string,
  userId: string,
  userName: string,
): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            // Clear assigneeId
            campaign.tasks[taskIndex].assigneeId = undefined

            // Ensure task is published
            campaign.tasks[taskIndex].isPublished = true
            campaign.tasks[taskIndex].publishedAt = Date.now()

            // Update the task's updatedAt timestamp
            campaign.tasks[taskIndex].updatedAt = Date.now()

            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error reassigning task:", error)
    return false
  }
}

// Mark a task as completed
export const markTaskCompleted = async (taskId: string, userId: string, userName: string): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            campaign.tasks[taskIndex].status = "completed"
            campaign.tasks[taskIndex].completedAt = Date.now()
            campaign.tasks[taskIndex].updatedAt = Date.now()
            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error marking task as completed:", error)
    return false
  }
}

// Check if a user has submitted a review for a task
export const hasUserSubmittedReview = (taskId: string, userId: string, userType: "employer" | "student"): boolean => {
  try {
    const task = getTaskById(taskId)

    if (!task) return false

    if (userType === "employer") {
      return !!task.employerReview && task.employerReview.reviewerId === userId
    } else {
      return !!task.studentReview && task.studentReview.reviewerId === userId
    }
  } catch (error) {
    console.error("Error checking if user submitted review:", error)
    return false
  }
}

// Submit a review for a task
export const submitTaskReview = async (
  taskId: string,
  reviewerId: string,
  reviewerName: string,
  reviewerType: "employer" | "student",
  recipientId: string,
  recipientName: string,
  rating: number,
  comment: string,
): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            const review: Review = {
              id: generateId(),
              reviewerId,
              reviewerName,
              reviewerType,
              recipientId,
              recipientName,
              taskId,
              taskTitle: campaign.tasks[taskIndex].title,
              rating,
              comment,
              createdAt: Date.now(),
            }

            // Add the review to the appropriate field
            if (reviewerType === "employer") {
              campaign.tasks[taskIndex].employerReview = review
            } else {
              campaign.tasks[taskIndex].studentReview = review
            }

            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error submitting review:", error)
    return false
  }
}

// Create a special task (checklist, credentials, brand brief, resource)
export const createSpecialTask = async (
  projectId: string,
  sprintId: string,
  campaignId: string,
  taskType: "checklist_library" | "credentials_library" | "brand_brief" | "resource_library",
  title: string,
  description: string,
  userId: string,
  userName: string,
  initialData?: any,
): Promise<string | null> => {
  try {
    // Get the project
    const project = getProject(projectId)
    if (!project) {
      console.error("Project not found:", projectId)
      return null
    }

    // Find the sprint and campaign if provided
    let sprintIndex = -1
    let campaignIndex = -1

    if (sprintId && campaignId) {
      // Find the sprint
      sprintIndex = project.sprints.findIndex((s) => s.id === sprintId)

      // Find the campaign if sprint exists
      if (sprintIndex !== -1) {
        campaignIndex = project.sprints[sprintIndex].campaigns.findIndex((c) => c.id === campaignId)
      }
    }

    // If sprint or campaign not found, use the first available ones
    if (sprintIndex === -1 && project.sprints.length > 0) {
      sprintIndex = 0

      if (project.sprints[0].campaigns.length > 0) {
        campaignIndex = 0
      }
    }

    // If still no campaign found, create a default one
    if (campaignIndex === -1) {
      if (sprintIndex === -1) {
        // Create a new sprint if none exists
        const newSprint = {
          id: generateId(),
          name: "Default Sprint",
          description: "Automatically created sprint for library items",
          startDate: Date.now(),
          endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
          projectId: projectId,
          campaigns: [],
        }

        project.sprints.push(newSprint)
        sprintIndex = project.sprints.length - 1
      }

      // Create a new campaign
      const newCampaign = {
        id: generateId(),
        name: "Library Items",
        description: "Automatically created campaign for library items",
        startDate: Date.now(),
        endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        sprintId: project.sprints[sprintIndex].id,
        tasks: [],
      }

      project.sprints[sprintIndex].campaigns.push(newCampaign)
      campaignIndex = project.sprints[sprintIndex].campaigns.length - 1
    }

    // Create task ID
    const taskId = generateId()

    // Create base task
    const task: Task = {
      id: taskId,
      title,
      description,
      status: taskType,
      priority: "medium",
      campaignId: project.sprints[sprintIndex].campaigns[campaignIndex].id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublished: false, // Special tasks can't be published
      editHistory: [
        {
          userId,
          userName,
          timestamp: Date.now(),
          action: `Created ${taskType.replace("_", " ")}`,
        },
      ],
      timelineMessages: [
        {
          id: generateId(),
          userId,
          userName,
          userType: "employer",
          content: `${taskType.replace("_", " ")} "${title}" was created`,
          timestamp: Date.now(),
          isSystemMessage: true,
        },
      ],
      comments: [],
    }

    // Add type-specific data
    if (taskType === "checklist_library") {
      task.checklistItems = initialData?.items || []
      task.category = initialData?.category
    } else if (taskType === "credentials_library") {
      task.credentials = initialData?.credentials || []
    } else if (taskType === "brand_brief") {
      task.brandBrief = {
        brandName: initialData?.brandName || "",
        clientName: initialData?.clientName || "",
        brandColors: initialData?.brandColors || [],
        brandFonts: initialData?.brandFonts || [],
        brandVoice: initialData?.brandVoice || "",
        targetAudience: initialData?.targetAudience || "",
        keyMessages: initialData?.keyMessages || [],
      }
    } else if (taskType === "resource_library") {
      task.resources = initialData?.resources || []
      task.category = initialData?.category
    }

    // Add the task to the campaign
    project.sprints[sprintIndex].campaigns[campaignIndex].tasks.push(task)

    // Update the project
    updateProject(project)

    return taskId
  } catch (error) {
    console.error(`Error creating ${taskType} task:`, error)
    return null
  }
}

// Toggle recurring task completion status
export const toggleRecurringTaskCompletion = async (
  taskId: string,
  userId: string,
  userName: string,
): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            const task = campaign.tasks[taskIndex]

            // Check if this is a recurring task
            if (!task.status.startsWith("recurring_")) {
              console.error("Cannot toggle completion for non-recurring task")
              return false
            }

            // Toggle completion status
            const isCompleted = !task.isRecurringCompleted
            task.isRecurringCompleted = isCompleted

            if (isCompleted) {
              // Calculate next due date based on recurrence type
              const now = new Date()
              let nextDueDate: Date

              if (task.status === "recurring_daily") {
                nextDueDate = new Date(now)
                nextDueDate.setDate(nextDueDate.getDate() + 1)
              } else if (task.status === "recurring_weekly") {
                nextDueDate = new Date(now)
                nextDueDate.setDate(nextDueDate.getDate() + 7)
              } else {
                // monthly
                nextDueDate = new Date(now)
                nextDueDate.setMonth(nextDueDate.getMonth() + 1)
              }

              // Set completion time and next due date
              task.lastCompletedAt = now.getTime()
              task.nextDueDate = nextDueDate.getTime()

              // Add to recurrence history
              if (!task.recurrenceHistory) {
                task.recurrenceHistory = []
              }

              task.recurrenceHistory.push({
                completedAt: now.getTime(),
                completedBy: userName,
                nextDueDate: nextDueDate.getTime(),
              })

              // Add to edit history
              if (!task.editHistory) {
                task.editHistory = []
              }

              task.editHistory.push({
                userId,
                userName,
                timestamp: now.getTime(),
                action: "Marked recurring task as completed",
              })

              // Add to timeline if enabled
              if (task.autoPostToTimeline !== false) {
                if (!task.timelineMessages) {
                  task.timelineMessages = []
                }

                task.timelineMessages.push({
                  id: generateId(),
                  userId,
                  userName,
                  userType: "employer",
                  content: `Marked task as completed. Next due: ${new Date(nextDueDate).toLocaleDateString()}`,
                  timestamp: now.getTime(),
                  isSystemMessage: true,
                })
              }
            } else {
              // If marking as incomplete, remove the last completion
              if (task.recurrenceHistory && task.recurrenceHistory.length > 0) {
                task.recurrenceHistory.pop()

                // Set lastCompletedAt to the previous completion, if any
                if (task.recurrenceHistory.length > 0) {
                  const lastRecord = task.recurrenceHistory[task.recurrenceHistory.length - 1]
                  task.lastCompletedAt = lastRecord.completedAt
                  task.nextDueDate = lastRecord.nextDueDate
                } else {
                  task.lastCompletedAt = undefined
                  task.nextDueDate = undefined
                }
              }

              // Add to edit history
              if (!task.editHistory) {
                task.editHistory = []
              }

              task.editHistory.push({
                userId,
                userName,
                timestamp: Date.now(),
                action: "Marked recurring task as incomplete",
              })

              // Add to timeline if enabled
              if (task.autoPostToTimeline !== false) {
                if (!task.timelineMessages) {
                  task.timelineMessages = []
                }

                task.timelineMessages.push({
                  id: generateId(),
                  userId,
                  userName,
                  userType: "employer",
                  content: "Marked task as incomplete",
                  timestamp: Date.now(),
                  isSystemMessage: true,
                })
              }
            }

            // Update the task's updatedAt timestamp
            task.updatedAt = Date.now()

            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error toggling recurring task completion:", error)
    return false
  }
}

// Check and reset recurring tasks that are due
export const checkAndResetRecurringTasks = (): void => {
  try {
    const projects = getProjects("all")
    let projectsUpdated = false
    const now = new Date().getTime()

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          for (let i = 0; i < campaign.tasks.length; i++) {
            const task = campaign.tasks[i]

            // Check if this is a completed recurring task
            if (
              task.status.startsWith("recurring_") &&
              task.isRecurringCompleted &&
              task.nextDueDate &&
              task.nextDueDate <= now
            ) {
              // Reset the task to incomplete as it's due again
              task.isRecurringCompleted = false

              // Calculate the next due date based on recurrence type
              let nextDueDate: Date
              const currentDueDate = new Date(task.nextDueDate)

              if (task.status === "recurring_daily") {
                nextDueDate = new Date(currentDueDate)
                nextDueDate.setDate(nextDueDate.getDate() + 1)
              } else if (task.status === "recurring_weekly") {
                nextDueDate = new Date(currentDueDate)
                nextDueDate.setDate(nextDueDate.getDate() + 7)
              } else {
                // monthly
                nextDueDate = new Date(currentDueDate)
                nextDueDate.setMonth(nextDueDate.getMonth() + 1)
              }

              // Add system message to timeline
              if (!task.timelineMessages) {
                task.timelineMessages = []
              }

              task.timelineMessages.push({
                id: generateId(),
                userId: "system",
                userName: "System",
                userType: "employer",
                content: `Task is due again`,
                timestamp: now,
                isSystemMessage: true,
              })

              // Update the task
              task.updatedAt = now
              projectsUpdated = true
            }
          }
        }
      }
    }

    if (projectsUpdated) {
      saveProjects(projects)
    }
  } catch (error) {
    console.error("Error checking and resetting recurring tasks:", error)
  }
}

// Add a function to add a timeline message
export const addTimelineMessage = async (
  taskId: string,
  content: string,
  userId: string,
  userName: string,
  userType: "employer" | "student",
  isSystemMessage: boolean,
): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            // Initialize timelineMessages array if it doesn't exist
            if (!campaign.tasks[taskIndex].timelineMessages) {
              campaign.tasks[taskIndex].timelineMessages = []
            }

            // Add the new timeline message
            campaign.tasks[taskIndex].timelineMessages.push({
              id: generateId(),
              userId,
              userName,
              userType,
              content,
              timestamp: Date.now(),
              isSystemMessage,
            })

            // Update the task's updatedAt timestamp
            campaign.tasks[taskIndex].updatedAt = Date.now()

            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error adding timeline message:", error)
    return false
  }
}

// Add a function to edit a timeline message
export const editTimelineMessage = async (
  taskId: string,
  messageId: string,
  content: string,
  userId: string,
  userName: string,
  userType: "employer" | "student",
): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            // Find the message
            const messageIndex = campaign.tasks[taskIndex].timelineMessages?.findIndex((msg) => msg.id === messageId)

            if (messageIndex !== undefined && messageIndex !== -1) {
              // Update the message
              campaign.tasks[taskIndex].timelineMessages![messageIndex] = {
                ...campaign.tasks[taskIndex].timelineMessages![messageIndex],
                content,
                edited: true,
                editedAt: Date.now(),
              }

              // Update the task's updatedAt timestamp
              campaign.tasks[taskIndex].updatedAt = Date.now()

              taskUpdated = true
              break
            }
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error editing timeline message:", error)
    return false
  }
}

// Add a function to delete a timeline message
export const deleteTimelineMessage = async (
  taskId: string,
  messageId: string,
  userId: string,
  userName: string,
  userType: "employer" | "student",
): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            // Find the message
            const messageIndex = campaign.tasks[taskIndex].timelineMessages?.findIndex((msg) => msg.id === messageId)

            if (messageIndex !== undefined && messageIndex !== -1) {
              // Mark the message as deleted
              campaign.tasks[taskIndex].timelineMessages![messageIndex] = {
                ...campaign.tasks[taskIndex].timelineMessages![messageIndex],
                content: "This message was deleted",
                isDeleted: true,
                deletedAt: Date.now(),
              }

              // Update the task's updatedAt timestamp
              campaign.tasks[taskIndex].updatedAt = Date.now()

              taskUpdated = true
              break
            }
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error deleting timeline message:", error)
    return false
  }
}

// Function to submit a task application
export const submitTaskApplication = async (
  taskId: string,
  studentId: string,
  studentName: string,
  studentEmail: string,
  note: string,
): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            // Initialize applications array if it doesn't exist
            if (!campaign.tasks[taskIndex].applications) {
              campaign.tasks[taskIndex].applications = []
            }

            // Add the new application
            campaign.tasks[taskIndex].applications.push({
              id: generateId(),
              studentId,
              studentName,
              studentEmail,
              note,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              status: "pending",
            })

            // Update the task's updatedAt timestamp
            campaign.tasks[taskIndex].updatedAt = Date.now()

            taskUpdated = true
            break
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error submitting task application:", error)
    return false
  }
}

// Function to get a student's application for a task
export const getStudentApplication = (taskId: string, studentId: string): TaskApplication | undefined => {
  try {
    const projects = getProjects("all")

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const task = campaign.tasks.find((task) => task.id === taskId)

          if (task && task.applications) {
            return task.applications.find((app) => app.studentId === studentId)
          }
        }
      }
    }

    return undefined
  } catch (error) {
    console.error("Error getting student application:", error)
    return undefined
  }
}

// Function to update application status
export const updateApplicationStatus = async (
  taskId: string,
  applicationId: string,
  newStatus: "pending" | "approved" | "rejected",
  userId?: string,
  userName?: string,
): Promise<boolean> => {
  try {
    const projects = getProjects("all")
    let taskUpdated = false
    let updatedTask = null

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          const taskIndex = campaign.tasks.findIndex((task) => task.id === taskId)

          if (taskIndex !== -1) {
            // Find the application
            const applicationIndex = campaign.tasks[taskIndex].applications?.findIndex(
              (app) => app.id === applicationId,
            )

            if (applicationIndex !== undefined && applicationIndex !== -1) {
              // Update the application status
              campaign.tasks[taskIndex].applications![applicationIndex] = {
                ...campaign.tasks[taskIndex].applications![applicationIndex],
                status: newStatus,
                updatedAt: Date.now(),
              }

              // If approved, set the student as the assignee
              if (newStatus === "approved") {
                const application = campaign.tasks[taskIndex].applications![applicationIndex]

                // Set the assigneeId
                campaign.tasks[taskIndex].assigneeId = application.studentId

                // Create or update the assignment object
                campaign.tasks[taskIndex].assignment = {
                  studentId: application.studentId,
                  studentEmail: application.studentEmail,
                  studentName: application.studentName,
                  assignedAt: Date.now(),
                  status: "active",
                }

                // Set detailsPostedToTimeline to false to trigger automatic posting of details
                campaign.tasks[taskIndex].detailsPostedToTimeline = false

                // Add system message to timeline
                if (!campaign.tasks[taskIndex].timelineMessages) {
                  campaign.tasks[taskIndex].timelineMessages = []
                }

                campaign.tasks[taskIndex].timelineMessages.push({
                  id: generateId(),
                  userId: userId || "system",
                  userName: userName || "System",
                  userType: "employer",
                  content: `${application.studentName} has been assigned to this task`,
                  timestamp: Date.now(),
                  isSystemMessage: true,
                })
              }

              // Update the task's updatedAt timestamp
              campaign.tasks[taskIndex].updatedAt = Date.now()

              // Store the updated task for debugging
              updatedTask = campaign.tasks[taskIndex]

              taskUpdated = true
              break
            }
          }
        }
        if (taskUpdated) break
      }
      if (taskUpdated) break
    }

    if (taskUpdated) {
      // Log the updated task for debugging
      if (typeof window !== "undefined") {
        console.log("Task updated successfully:", updatedTask)
        console.log("Assignment status:", updatedTask?.assignment?.status)
        console.log("Has assigned student:", !!updatedTask?.assignment && updatedTask?.assignment?.status === "active")
      }

      saveProjects(projects)
      return true
    }

    return false
  } catch (error) {
    console.error("Error updating application status:", error)
    return false
  }
}

// Add this function to get tasks by type
export const getTasksByType = async (projectId: string, taskType: TaskStatus): Promise<Task[]> => {
  try {
    const project = getProject(projectId)
    if (!project) return []

    const tasks: Task[] = []

    project.sprints.forEach((sprint) => {
      sprint.campaigns.forEach((campaign) => {
        campaign.tasks.forEach((task) => {
          if (task.status === taskType) {
            tasks.push(task)
          }
        })
      })
    })

    return tasks
  } catch (error) {
    console.error(`Error getting tasks of type ${taskType}:`, error)
    return []
  }
}

// Centralized constants for KushL app

// Task Categories
export const TASK_CATEGORIES = [
  "Website Development",
  "Video Editing",
  "Software Development",
  "Search Engine Optimization",
  "Architecture & Interior Design",
  "Book Design",
  "User Generated Content",
  "Voice Over",
  "Social Media Marketing",
  "AI Development",
  "Logo Design",
  "Graphics & Design",
  "Digital Marketing",
  "Writing & Translation",
  "Animation",
  "Music & Audio",
  "Programming & Tech",
  "Business Consulting",
  "Data Analysis",
  "Photography",
  "Finance",
  "Legal Services",
]

export const getCommissionPercentage = (amount: number): number => {
  const PLATFORM_CHARGES_TIERS = [
    { minAmount: 0, maxAmount: 999, commissionPercentage: 15 },
    { minAmount: 1000, maxAmount: 4999, commissionPercentage: 10 },
    { minAmount: 5000, maxAmount: 9999, commissionPercentage: 7 },
    { minAmount: 10000, maxAmount: 49999, commissionPercentage: 5 },
    { minAmount: 50000, maxAmount: 100000, commissionPercentage: 3 },
  ]
  const tier =
    PLATFORM_CHARGES_TIERS.find((tier) => amount >= tier.minAmount && amount <= tier.maxAmount) ||
    PLATFORM_CHARGES_TIERS[PLATFORM_CHARGES_TIERS.length - 1]

  return tier.commissionPercentage
}

// Add student task limit functionality
// Add these functions to implement the task limit system:

// Check if a student can apply for a new task
export const canStudentApplyForTask = (studentId: string): { canApply: boolean; reason?: string } => {
  try {
    // Get all tasks
    const projects = getProjects("all")

    // Find all tasks assigned to this student
    const assignedTasks: Task[] = []

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          for (const task of campaign.tasks) {
            if (task.assignment && task.assignment.studentId === studentId && task.status !== "completed") {
              assignedTasks.push(task)
            }
          }
        }
      }
    }

    // Get student's completed tasks and earnings to determine their task limit
    const completedTasks = getStudentCompletedTasksHelper(studentId)
    const totalEarnings = getStudentTotalEarningsHelper(studentId)

    // Calculate task limit based on earnings and completed tasks
    const taskLimit = calculateStudentTaskLimit(completedTasks.length, totalEarnings)

    // Check if student has reached their limit
    if (assignedTasks.length >= taskLimit) {
      return {
        canApply: false,
        reason: `You can only work on ${taskLimit} task(s) at a time. Complete your current tasks to unlock more slots.`,
      }
    }

    return { canApply: true }
  } catch (error) {
    console.error("Error checking if student can apply for task:", error)
    return { canApply: false, reason: "An error occurred while checking your eligibility." }
  }
}

// Get all completed tasks for a student
const getStudentCompletedTasksHelper = (studentId: string): Task[] => {
  try {
    const projects = getProjects("all")
    const completedTasks: Task[] = []

    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          for (const task of campaign.tasks) {
            if (task.assignment && task.assignment.studentId === studentId && task.status === "completed") {
              completedTasks.push(task)
            }
          }
        }
      }
    }

    return completedTasks
  } catch (error) {
    console.error("Error getting student completed tasks:", error)
    return []
  }
}

// Calculate student's total earnings
const getStudentTotalEarningsHelper = (studentId: string): number => {
  try {
    const completedTasks = getStudentCompletedTasksHelper(studentId)

    // Sum up the earnings from all completed tasks
    return completedTasks.reduce((total, task) => {
      const taskPrice = task.price || 0
      const studentEarnings = calculateStudentEarnings(taskPrice)
      return total + studentEarnings
    }, 0)
  } catch (error) {
    console.error("Error calculating student total earnings:", error)
    return 0
  }
}

// Calculate student task limit based on completed tasks and earnings
export const calculateStudentTaskLimit = (completedTasksCount: number, totalEarnings: number): number => {
  // Base limit is 1 task at a time
  let limit = 1

  // Increase limit based on completed tasks
  if (completedTasksCount >= 10) limit = 2
  if (completedTasksCount >= 25) limit = 3
  if (completedTasksCount >= 50) limit = 4

  // Increase limit based on earnings (in INR)
  if (totalEarnings >= 10000) limit = Math.max(limit, 2)
  if (totalEarnings >= 25000) limit = Math.max(limit, 3)
  if (totalEarnings >= 50000) limit = Math.max(limit, 4)
  if (totalEarnings >= 100000) limit = Math.max(limit, 5)
  if (totalEarnings >= 250000) limit = Math.max(limit, 6)
  if (totalEarnings >= 500000) limit = Math.max(limit, 7)

  return limit
}

// Calculate student earnings from task price
export const calculateStudentEarnings = (taskPrice: number): number => {
  // Student gets the task price minus platform commission
  const commissionPercentage = getCommissionPercentage(taskPrice)
  const commission = (taskPrice * commissionPercentage) / 100
  return taskPrice - commission
}

// Debug function to check task assignment
export const debugTaskAssignment = (taskId: string): any => {
  try {
    const task = getTaskById(taskId)
    if (!task) {
      return { error: "Task not found" }
    }

    return {
      taskId: task.id,
      title: task.title,
      assigneeId: task.assigneeId,
      hasAssignment: !!task.assignment,
      assignmentStatus: task.assignment?.status,
      applications: task.applications?.map((app) => ({
        id: app.id,
        studentId: app.studentId,
        studentName: app.studentName,
        status: app.status,
      })),
    }
  } catch (error) {
    console.error("Error debugging task assignment:", error)
    return { error: String(error) }
  }
}

// Get all completed tasks for a student
export function getStudentCompletedTasks(studentId: string) {
  try {
    const allProjects = getAllProjects() || []
    const completedTasks = []

    // Traverse through all projects to find completed tasks by this student
    allProjects.forEach((project) => {
      if (!project.sprints) return

      project.sprints.forEach((sprint) => {
        if (!sprint.campaigns) return

        sprint.campaigns.forEach((campaign) => {
          if (!campaign.tasks) return

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
export function getStudentTotalEarnings(studentId: string) {
  try {
    const completedTasks = getStudentCompletedTasks(studentId)
    return completedTasks.reduce((sum, task) => sum + (Number(task.price) || 0), 0)
  } catch (error) {
    console.error("Error calculating total earnings:", error)
    return 0
  }
}

// Get task categories for a student
export function getStudentTaskCategories(studentId: string) {
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
export function getStudentEmployers(studentId: string) {
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

// Helper function to get all projects
function getAllProjects() {
  try {
    // In a real implementation, this would fetch from your database
    const projects = JSON.parse(localStorage.getItem("projects") || "[]")
    return projects
  } catch (error) {
    console.error("Error getting projects:", error)
    return []
  }
}
