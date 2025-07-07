"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getProject, generateId, addTaskToCampaign } from "@/lib/task-management"
import { useToast } from "@/components/ui/use-toast"
import { DebugPanel } from "@/components/debug-panel"

// Add this component at the top of the file, right after the imports
function ErrorToast({ message }: { message: string }) {
  return (
    <div className="fixed top-4 left-0 right-0 mx-auto w-[90%] max-w-md bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-md shadow-lg z-50 flex items-center">
      <div className="mr-2 text-red-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>{message}</div>
    </div>
  )
}

export default function SimpleTaskPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Add this useEffect to clear the form error after a timeout
  useEffect(() => {
    if (formError) {
      const timer = setTimeout(() => {
        setFormError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [formError])

  // Enhance the handleSubmit function with better error handling
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setFormError("Please enter a task title")
      toast({
        title: "Title is required",
        description: "Please enter a task title",
        variant: "destructive",
      })

      // Focus and highlight the title input
      const titleInput = document.getElementById("title")
      if (titleInput) {
        titleInput.scrollIntoView({ behavior: "smooth", block: "center" })
        titleInput.focus()
        titleInput.classList.add("border-red-500", "ring-red-500")
        setTimeout(() => {
          titleInput.classList.remove("border-red-500", "ring-red-500")
        }, 3000)
      }
      return
    }

    setIsSubmitting(true)

    try {
      // Get project
      const project = getProject(id as string)
      if (!project) {
        setFormError("The project could not be found")
        toast({
          title: "Project not found",
          description: "The project could not be found",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Check if project has any sprints
      if (project.sprints.length === 0) {
        // Create a default sprint
        const sprintId = generateId()
        const campaignId = generateId()

        project.sprints.push({
          id: sprintId,
          name: "Default Sprint",
          startDate: Date.now(),
          endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
          projectId: project.id,
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
        })
      }

      // Get the first sprint and campaign
      const sprint = project.sprints[0]
      const campaign = sprint.campaigns[0]

      // Create new task
      const taskId = generateId()
      const newTask = {
        id: taskId,
        title: title.trim(),
        description: "",
        status: "draft" as const,
        priority: "medium" as const,
        campaignId: campaign.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPublished: false,
      }

      // Add task to campaign
      const success = addTaskToCampaign(project.id, sprint.id, campaign.id, newTask)

      if (success) {
        // Store the task ID in localStorage for highlighting
        localStorage.setItem("highlight_task_id", taskId)

        // Show success message
        toast({
          title: "Task created successfully",
          description: "Your task has been created successfully",
        })

        // Redirect back to project page
        router.push(`/post/project/${id}?view=kanban&newTask=${taskId}`)
      } else {
        throw new Error("Failed to add task to campaign")
      }
    } catch (error) {
      console.error("Error creating task:", error)
      setFormError("There was an error creating your task. Please try again.")
      toast({
        title: "Error creating task",
        description: "There was an error creating your task. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-6">
      {formError && <ErrorToast message={formError} />}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create Simple Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">This is a simplified task creation form for testing purposes.</p>
        <Button variant="link" onClick={() => router.push(`/post/project/${id}/create-task`)}>
          Go to the full form
        </Button>
      </div>

      <DebugPanel />
    </div>
  )
}
