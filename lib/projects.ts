// Re-export project-related functions from task-management
import {
  Project,
  getProjects,
  getProject,
  addProject,
  updateProject,
  deleteProject,
  generateId,
} from "./task-management"

export { Project, getProjects, getProject, addProject, updateProject, deleteProject, generateId }

// Add any additional project-specific functions here
export const getProjectsByUser = (userId: string): Project[] => {
  return getProjects(userId)
}

export const getPublicProjectsByUser = (userId: string): Project[] => {
  const projects = getProjects(userId)
  // In a real implementation, you might filter for public projects
  // For now, we'll just return all projects
  return projects
}
