"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { getProjects, type Task } from "@/lib/task-management"
import { SharedTaskView } from "@/components/shared-task-view"
import { Button } from "@/components/ui/button"
import { Plus, CheckSquare, Key, Palette, BookOpen } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function StudentActiveTasks() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null)
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Redirect if not logged in or not a student
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "student") {
      router.push("/dashboard")
      return
    }

    // Get default project ID for this student
    const storedDefaultProjectId = localStorage.getItem(`kushl_default_project_${user.id}`)
    setDefaultProjectId(storedDefaultProjectId)

    // Check for highlighted task ID in localStorage
    const highlightTask = localStorage.getItem("highlight_task_id")
    if (highlightTask) {
      setHighlightTaskId(highlightTask)
      setSuccessMessage("Task created successfully!")
      localStorage.removeItem("highlight_task_id")
    }
  }, [user, router])

  // Load all tasks assigned to this student
  useEffect(() => {
    if (!user) return

    const loadStudentTasks = () => {
      setIsLoading(true)
      try {
        // Get all projects
        const allProjects = getProjects("all")

        // Find all tasks assigned to this student
        const studentTasks: Task[] = []

        allProjects.forEach((project) => {
          project.sprints.forEach((sprint) => {
            sprint.campaigns.forEach((campaign) => {
              campaign.tasks.forEach((task) => {
                // Include tasks assigned to this student
                const isAssigned = task.assignment && task.assignment.studentId === user.id

                // Include tasks created by this student
                const isCreatedByStudent = task.createdBy === user.id

                // Include tasks in student's libraries
                const isInStudentLibrary =
                  ["checklist_library", "credentials_library", "brand_brief", "resource_library"].includes(
                    task.status,
                  ) && task.createdBy === user.id

                if (isAssigned || isCreatedByStudent || isInStudentLibrary) {
                  studentTasks.push({
                    ...task,
                    projectName: project.name,
                    sprintName: sprint.name,
                    projectId: project.id,
                    sprintId: sprint.id,
                    campaignId: campaign.id,
                  })
                }
              })
            })
          })
        })

        setTasks(studentTasks)
      } catch (error) {
        console.error("Error loading student tasks:", error)
        toast({
          title: "Error",
          description: "Failed to load your tasks. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStudentTasks()
  }, [user, toast])

  // Handle creating a new task
  const handleCreateTask = () => {
    if (!defaultProjectId) {
      toast({
        title: "No default project",
        description: "Please set a default project first",
        variant: "destructive",
      })
      return
    }

    router.push(`/post/project/${defaultProjectId}/create-task?student=true`)
  }

  // Handle library item creation
  const handleCreateLibraryItem = (type: string) => {
    if (!defaultProjectId) {
      toast({
        title: "No default project",
        description: "Please set a default project first",
        variant: "destructive",
      })
      return
    }

    router.push(`/post/project/${defaultProjectId}/create-library-item?type=${type}`)
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="container py-4 space-y-4 mb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Active Tasks</h1>

        {/* Create Library Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Create Library Item</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => handleCreateLibraryItem("checklist_library")}>
              <CheckSquare className="mr-2 h-4 w-4" />
              Checklist
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => handleCreateLibraryItem("credentials_library")}>
              <Key className="mr-2 h-4 w-4" />
              Credentials
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => handleCreateLibraryItem("brand_brief")}>
              <Palette className="mr-2 h-4 w-4" />
              Brand Brief
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => handleCreateLibraryItem("resource_library")}>
              <BookOpen className="mr-2 h-4 w-4" />
              Resources
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SharedTaskView
        title="Active Tasks"
        tasks={tasks}
        backLink="/dashboard"
        projectId={defaultProjectId || undefined}
        userType="student"
        highlightTaskId={highlightTaskId}
        successMessage={successMessage}
        showSprints={false}
        onCreateTask={handleCreateTask}
      />
    </div>
  )
}
