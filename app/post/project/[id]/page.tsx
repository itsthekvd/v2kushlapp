"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  type Project,
  type Sprint,
  type Task,
  getProject,
  updateProject,
  generateId,
  type TaskView,
} from "@/lib/task-management"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SharedTaskView } from "@/components/shared-task-view"

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [isCreateSprintDialogOpen, setIsCreateSprintDialogOpen] = useState(false)
  const [view, setView] = useState<TaskView>("kanban")
  const [isLoading, setIsLoading] = useState(true)
  const [newTaskId, setNewTaskId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Add state for campaign creation dialog
  const [isCreateCampaignDialogOpen, setIsCreateCampaignDialogOpen] = useState(false)
  const [selectedSprintId, setSelectedSprintId] = useState<string>("")
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")

  // Add state for special task creation dialog
  const [isCreateSpecialTaskOpen, setIsCreateSpecialTaskOpen] = useState(false)
  const [specialTaskType, setSpecialTaskType] = useState<
    "checklist_library" | "credentials_library" | "brand_brief" | "resource_library" | null
  >(null)

  // Use refs to track interval and prevent stale closures
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const projectRef = useRef<Project | null>(null)

  // Load project data once when component mounts
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "employer") {
      router.push("/")
      return
    }

    // Initial load of project data
    const loadProjectData = () => {
      try {
        const projectId = id as string
        const projectData = getProject(projectId)

        if (projectData) {
          console.log("Project loaded:", projectData.name)
          console.log("Project has sprints:", projectData.sprints.length)
          setProject(projectData)
          projectRef.current = projectData

          // If there's only one sprint, select it by default
          if (projectData.sprints.length === 1) {
            setSelectedSprintId(projectData.sprints[0].id)

            // If there's only one campaign in the sprint, select it by default
            if (projectData.sprints[0].campaigns.length === 1) {
              setSelectedCampaignId(projectData.sprints[0].campaigns[0].id)
            }
          }
        } else {
          console.error("Project not found for ID:", projectId)
          router.push("/post")
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading project data:", error)
        setIsLoading(false)
      }
    }

    loadProjectData()

    // Clean up function to clear interval
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [id, user, router])

  // Set up interval for periodic refresh - separate from initial data loading
  useEffect(() => {
    // Only set up interval if project is loaded successfully
    if (project) {
      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      const projectId = id as string
      intervalRef.current = setInterval(() => {
        try {
          const refreshedProject = getProject(projectId)
          if (refreshedProject) {
            setProject(refreshedProject)
            projectRef.current = refreshedProject
          }
        } catch (error) {
          console.error("Error refreshing project data:", error)
        }
      }, 5000)
    }

    // Clean up function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [id, project])

  // Handle URL parameters and localStorage for task highlighting - separate effect
  useEffect(() => {
    // Check for new task in URL params
    const newTaskParam = searchParams.get("newTask")
    if (newTaskParam) {
      setNewTaskId(newTaskParam)
      setSuccessMessage("Task created successfully!")

      // Set view based on URL parameter or default to the task's status
      const viewParam = searchParams.get("view")
      if (viewParam) {
        setView(viewParam as TaskView)
      }

      // Clear the URL parameters after reading them
      const timeoutId = setTimeout(() => {
        window.history.replaceState({}, "", `/post/project/${id}`)
      }, 300)
      return () => clearTimeout(timeoutId)
    }

    // Check for highlighted task ID in localStorage
    const highlightTaskId = localStorage.getItem("highlight_task_id")
    if (highlightTaskId) {
      setNewTaskId(highlightTaskId)
      setSuccessMessage("Task created successfully!")
      localStorage.removeItem("highlight_task_id")
    }
  }, [id, searchParams])

  // Handle closing the success message - separate effect with cleanup
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (successMessage) {
      timer = setTimeout(() => {
        setSuccessMessage(null)
        setNewTaskId(null)
      }, 5000)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [successMessage])

  // Memoize functions to prevent recreating them on every render
  const handleCreateSprint = useCallback(
    (name: string, startDate: Date, endDate: Date, description?: string) => {
      if (!project) return

      const newSprint: Sprint = {
        id: generateId(),
        name,
        description,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        projectId: project.id,
        campaigns: [
          {
            id: generateId(),
            name: "Default Campaign",
            startDate: startDate.getTime(),
            endDate: endDate.getTime(),
            sprintId: "", // Will be set below
            tasks: [],
          },
        ],
      }

      // Set the sprintId for the default campaign
      newSprint.campaigns[0].sprintId = newSprint.id

      const updatedProject = {
        ...project,
        sprints: [...project.sprints, newSprint],
        updatedAt: Date.now(),
      }

      updateProject(updatedProject)
      setProject(updatedProject)
      projectRef.current = updatedProject
      setIsCreateSprintDialogOpen(false)

      // Set the selected sprint and campaign to the newly created ones
      setSelectedSprintId(newSprint.id)
      setSelectedCampaignId(newSprint.campaigns[0].id)

      // Show success message
      toast({
        title: "Sprint created",
        description: `Sprint "${name}" has been created successfully.`,
      })
    },
    [project],
  )

  // Memoize handleCreateCampaign
  const handleCreateCampaign = useCallback(
    (name: string, startDate: Date, endDate: Date, description?: string) => {
      if (!project) return

      const sprintIndex = project.sprints.findIndex((s) => s.id === selectedSprintId)
      if (sprintIndex === -1) return

      const newCampaign = {
        id: generateId(),
        name,
        description,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        sprintId: selectedSprintId,
        tasks: [],
      }

      const updatedSprints = [...project.sprints]
      updatedSprints[sprintIndex] = {
        ...updatedSprints[sprintIndex],
        campaigns: [...updatedSprints[sprintIndex].campaigns, newCampaign],
      }

      const updatedProject = {
        ...project,
        sprints: updatedSprints,
        updatedAt: Date.now(),
      }

      updateProject(updatedProject)
      setProject(updatedProject)
      projectRef.current = updatedProject
      setIsCreateCampaignDialogOpen(false)

      // Set the selected campaign to the newly created one
      setSelectedCampaignId(newCampaign.id)

      // Show success message
      toast({
        title: "Campaign created",
        description: `Campaign "${name}" has been created successfully.`,
      })
    },
    [project, selectedSprintId],
  )

  // Memoize handleOpenCreateCampaign
  const handleOpenCreateCampaign = useCallback((sprintId: string) => {
    setSelectedSprintId(sprintId)
    setIsCreateCampaignDialogOpen(true)
  }, [])

  // Memoize handleSprintClick
  const handleSprintClick = useCallback((sprintId: string) => {
    // Use projectRef.current to avoid stale closures
    const currentProject = projectRef.current
    if (!currentProject) return

    const sprint = currentProject.sprints.find((s) => s.id === sprintId)
    if (sprint) {
      // Set the selected sprint
      setSelectedSprintId(sprintId)

      // If there's only one campaign, select it automatically
      if (sprint.campaigns.length === 1) {
        setSelectedCampaignId(sprint.campaigns[0].id)
      } else {
        // Otherwise, clear the selected campaign
        setSelectedCampaignId("")
      }

      // Get all tasks from this sprint's campaigns
      const sprintTasks: Task[] = []
      sprint.campaigns.forEach((campaign) => {
        sprintTasks.push(...campaign.tasks)
      })

      // You could set these tasks to a state variable to display them
      // For now, we'll just show a toast notification
      toast({
        title: `Sprint: ${sprint.name}`,
        description: `This sprint has ${sprintTasks.length} tasks across ${sprint.campaigns.length} campaigns.`,
      })
    }
  }, [])

  // Memoize getAllTasks to prevent recreation on every render
  const getAllTasks = useCallback((): Task[] => {
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
  }, [project])

  // Memoize handleCreateTask
  const handleCreateTask = useCallback(() => {
    // Use projectRef.current to avoid stale closures
    const currentProject = projectRef.current
    if (!currentProject) return

    // If there are no sprints, create a default sprint first
    if (currentProject.sprints.length === 0) {
      const sprintId = generateId()
      const campaignId = generateId()

      const updatedProject = {
        ...currentProject,
        sprints: [
          {
            id: sprintId,
            name: "Default Sprint",
            startDate: Date.now(),
            endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
            projectId: currentProject.id,
            campaigns: [
              {
                id: campaignId,
                name: "Default Campaign",
                startDate: Date.now(),
                endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
                sprintId: sprintId,
                tasks: [],
              },
            ],
          },
        ],
        updatedAt: Date.now(),
      }

      updateProject(updatedProject)
      setProject(updatedProject)
      projectRef.current = updatedProject

      // Set the selected sprint and campaign
      setSelectedSprintId(sprintId)
      setSelectedCampaignId(campaignId)

      toast({
        title: "Default sprint created",
        description: "A default sprint and campaign have been created for your tasks.",
      })
    }

    // Redirect to task creation page
    router.push(`/post/project/${id}/create-task`)
  }, [id, router])

  // Handle creating special tasks
  const handleCreateSpecialTask = useCallback(
    (type: "checklist_library" | "credentials_library" | "brand_brief" | "resource_library") => {
      // Check if we have a selected sprint and campaign
      if (!selectedSprintId || !selectedCampaignId) {
        toast({
          title: "Please select a sprint and campaign",
          description: "You need to select a sprint and campaign before creating a special task.",
          variant: "destructive",
        })
        return
      }

      setSpecialTaskType(type)
      setIsCreateSpecialTaskOpen(true)
    },
    [selectedSprintId, selectedCampaignId],
  )

  if (isLoading) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Project not found</h1>
        <Button onClick={() => router.push("/post")}>Back to Projects</Button>
      </div>
    )
  }

  return (
    <SharedTaskView
      title={project.name}
      description={project.description}
      tasks={getAllTasks()}
      backLink="/my-tasks"
      projectId={id as string}
      sprintId={selectedSprintId}
      campaignId={selectedCampaignId}
      userType="employer"
      highlightTaskId={newTaskId}
      successMessage={successMessage}
      showSprints={true}
      showFloatingMenu={true}
    />
  )
}
