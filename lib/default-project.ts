import { generateId } from "./storage"

/**
 * Helper functions for managing default projects
 */

// Project type definition
export interface Project {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
  ownerId: string
  sprints: Sprint[]
}

// Sprint type definition
export interface Sprint {
  id: string
  name: string
  description: string
  startDate: number
  endDate: number
  projectId: string
  campaigns: Campaign[]
}

// Campaign type definition
export interface Campaign {
  id: string
  name: string
  description: string
  startDate: number
  endDate: number
  sprintId: string
  tasks: Task[]
}

// Task type definition
export interface Task {
  id: string
  name: string
  description: string
  status: string
  priority: string
  assignedTo?: string
  campaignId: string
  createdAt: number
  updatedAt: number
}

// Get the default project ID for a user
export function getDefaultProjectId(userId: string): string | null {
  if (typeof window === "undefined") return null

  return localStorage.getItem(`kushl_default_project_${userId}`) || null
}

// Set the default project ID for a user
export function setDefaultProjectId(userId: string, projectId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(`kushl_default_project_${userId}`, projectId)
  }
}

// Get all projects
export function getProjects(filter: "all" | "user" = "all", userId?: string): Project[] {
  if (typeof window === "undefined") return []

  try {
    const projectsJson = localStorage.getItem("kushl_projects")
    if (!projectsJson) return []

    const projects: Project[] = JSON.parse(projectsJson)

    if (filter === "user" && userId) {
      return projects.filter((project) => project.ownerId === userId)
    }

    return projects
  } catch (error) {
    console.error("Error getting projects:", error)
    return []
  }
}

// Save projects to localStorage
export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("kushl_projects", JSON.stringify(projects))
  } catch (error) {
    console.error("Error saving projects:", error)
  }
}

// Create default project for a new user
export const createDefaultProjectForUser = async (userId: string, userName: string): Promise<string> => {
  try {
    const projectId = generateId()
    const sprintId = generateId()
    const campaignId = generateId()
    const now = Date.now()

    // Create a default project with a sprint and campaign
    const newProject: Project = {
      id: projectId,
      name: "My First Project",
      description: "Default project created automatically",
      createdAt: now,
      updatedAt: now,
      ownerId: userId,
      sprints: [
        {
          id: sprintId,
          name: "Default Sprint",
          description: "Automatically created sprint",
          startDate: now,
          endDate: now + 30 * 24 * 60 * 60 * 1000, // 30 days from now
          projectId: projectId,
          campaigns: [
            {
              id: campaignId,
              name: "Default Campaign",
              description: "Automatically created campaign",
              startDate: now,
              endDate: now + 30 * 24 * 60 * 60 * 1000, // 30 days from now
              sprintId: sprintId,
              tasks: [],
            },
          ],
        },
      ],
    }

    const projects = getProjects("all")
    projects.push(newProject)
    saveProjects(projects)

    setDefaultProjectId(userId, projectId)

    return projectId
  } catch (error) {
    console.error("Error creating default project:", error)
    throw error
  }
}

export function getProject(projectId: string): Project | undefined {
  if (!projectId || typeof window === "undefined") {
    return undefined
  }

  try {
    const projects = getProjects("all")
    return projects.find((project) => project.id === projectId)
  } catch (error) {
    console.error(`Error getting project ${projectId}:`, error)
  }
  return undefined
}

export function addProject(project: Project): void {
  const projects = getProjects("all")
  projects.push(project)
  saveProjects(projects)
}
