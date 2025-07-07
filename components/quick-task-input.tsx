"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { generateId } from "@/lib/task-management"
import { getProject, addProject, setDefaultProjectId } from "@/lib/default-project"
import { toast } from "@/components/ui/use-toast"
import { addTaskToCampaign } from "@/lib/task-management"

interface QuickTaskInputProps {
  userId: string
  defaultProjectId?: string | null
  onTaskAdded?: () => void
}

export function QuickTaskInput({ userId, defaultProjectId, onTaskAdded }: QuickTaskInputProps) {
  const [taskTitle, setTaskTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskTitle.trim()) return

    setIsSubmitting(true)

    try {
      // Get the default project
      let projectId = defaultProjectId
      let sprintId = ""
      let campaignId = ""

      if (projectId) {
        // Get the first sprint and campaign from the default project
        const project = getProject(projectId)
        if (project && project.sprints.length > 0) {
          sprintId = project.sprints[0].id

          if (project.sprints[0].campaigns.length > 0) {
            campaignId = project.sprints[0].campaigns[0].id
          }
        }
      }

      // If no default project or missing sprint/campaign, create them
      if (!projectId || !sprintId || !campaignId) {
        // Create a new project
        projectId = generateId()
        const newProject = {
          id: projectId,
          name: "Quick Tasks",
          description: "Project created from quick task input",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ownerId: userId,
          sprints: [],
        }

        // Create a sprint
        sprintId = generateId()
        const newSprint = {
          id: sprintId,
          name: "Main Sprint",
          description: "Default sprint",
          startDate: Date.now(),
          endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
          projectId: projectId,
          campaigns: [],
        }

        // Create a campaign
        campaignId = generateId()
        const newCampaign = {
          id: campaignId,
          name: "General Tasks",
          description: "Default campaign",
          startDate: Date.now(),
          endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
          sprintId: sprintId,
          tasks: [],
        }

        newSprint.campaigns.push(newCampaign)
        newProject.sprints.push(newSprint)

        // Save the project
        addProject(newProject)

        // Set as default project
        setDefaultProjectId(userId, projectId)
      }

      // Create the task
      const taskId = generateId()
      const task = {
        id: taskId,
        title: taskTitle,
        description: "",
        status: "to_do",
        priority: "medium",
        campaignId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPublished: true,
        publishedAt: Date.now(),
        category: "General",
        editHistory: [
          {
            userId,
            userName: "You",
            timestamp: Date.now(),
            action: "Created task",
          },
        ],
      }

      // Add the task to the campaign
      const success = await addTaskToCampaign(projectId, sprintId, campaignId, task, userId, "You")

      if (success) {
        toast({
          title: "Task created",
          description: "Your task has been created successfully",
        })

        // Clear input
        setTaskTitle("")

        // Callback
        if (onTaskAdded) {
          onTaskAdded()
        }
      } else {
        throw new Error("Failed to create task")
      }
    } catch (error) {
      console.error("Error creating quick task:", error)
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        placeholder="Add a quick task..."
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" size="icon" disabled={!taskTitle.trim() || isSubmitting}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  )
}
