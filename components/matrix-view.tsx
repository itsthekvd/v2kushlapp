"use client"

import type React from "react"

import type { Task } from "@/lib/task-management"
import { Card, CardContent } from "@/components/ui/card"
import { TaskCard } from "@/components/task-card"
import { useState, useEffect } from "react"
import { updateTaskPriority, updateTaskStatus, getSprintAndCampaignNames } from "@/lib/task-management"
import { useToast } from "@/components/ui/use-toast"

interface MatrixViewProps {
  tasks: Task[]
  projectId?: string
}

export function MatrixView({ tasks, projectId }: MatrixViewProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [taskDetails, setTaskDetails] = useState<Record<string, { projectName?: string; sprintName?: string }>>({})
  const { toast } = useToast()

  // Load project and sprint names for each task
  useEffect(() => {
    const details: Record<string, { projectName?: string; sprintName?: string }> = {}

    tasks.forEach((task) => {
      const names = getSprintAndCampaignNames(task.id)
      details[task.id] = names
    })

    setTaskDetails(details)
  }, [tasks])

  // Eisenhower Matrix: Urgent/Important, Not Urgent/Important, Urgent/Not Important, Not Urgent/Not Important
  const urgentImportant = tasks.filter((task) => task.priority === "urgent" || task.priority === "high")
  const notUrgentImportant = tasks.filter((task) => task.priority === "medium" && task.status !== "completed")
  const urgentNotImportant = tasks.filter(
    (task) =>
      (task.priority === "urgent" || task.priority === "high") &&
      (task.status === "draft" || task.status === "published"),
  )
  const notUrgentNotImportant = tasks.filter(
    (task) => task.priority === "low" || task.status === "completed" || task.status === "archived",
  )

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.setData("text/plain", task.id)

    // For better drag image (optional)
    if (e.dataTransfer.setDragImage && e.currentTarget) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, quadrant: string) => {
    e.preventDefault()

    if (!draggedTask) return

    try {
      let newPriority = draggedTask.priority
      let newStatus = draggedTask.status

      // Determine new priority and status based on quadrant
      switch (quadrant) {
        case "urgent-important":
          newPriority = "urgent"
          break
        case "not-urgent-important":
          newPriority = "medium"
          newStatus = "in_progress"
          break
        case "urgent-not-important":
          newPriority = "high"
          newStatus = "published"
          break
        case "not-urgent-not-important":
          newPriority = "low"
          break
      }

      // Only update if there's a change
      if (newPriority !== draggedTask.priority) {
        await updateTaskPriority(draggedTask.id, newPriority as any)
      }

      if (newStatus !== draggedTask.status) {
        await updateTaskStatus(draggedTask.id, newStatus as any)
      }

      // Show success toast
      toast({
        title: "Task updated",
        description: `Task moved to ${quadrant.replace(/-/g, " ")} quadrant`,
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error updating task",
        description: "There was an error updating the task",
        variant: "destructive",
      })
    }

    setDraggedTask(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent
          className={`p-4 ${draggedTask && "border-2 border-dashed border-red-500"}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "urgent-important")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-red-500">Urgent & Important</h3>
            <span className="text-xs text-muted-foreground">Do First</span>
          </div>

          <div className="space-y-2 min-h-[200px]">
            {urgentImportant.length > 0 ? (
              urgentImportant.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectName={taskDetails[task.id]?.projectName}
                  sprintName={taskDetails[task.id]?.sprintName}
                  isDragging={draggedTask?.id === task.id}
                  onDragStart={handleDragStart}
                  onDragEnd={() => setDraggedTask(null)}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No tasks in this quadrant
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent
          className={`p-4 ${draggedTask && "border-2 border-dashed border-blue-500"}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "not-urgent-important")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-500">Not Urgent & Important</h3>
            <span className="text-xs text-muted-foreground">Schedule</span>
          </div>

          <div className="space-y-2 min-h-[200px]">
            {notUrgentImportant.length > 0 ? (
              notUrgentImportant.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectName={taskDetails[task.id]?.projectName}
                  sprintName={taskDetails[task.id]?.sprintName}
                  isDragging={draggedTask?.id === task.id}
                  onDragStart={handleDragStart}
                  onDragEnd={() => setDraggedTask(null)}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No tasks in this quadrant
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent
          className={`p-4 ${draggedTask && "border-2 border-dashed border-yellow-500"}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "urgent-not-important")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-yellow-500">Urgent & Not Important</h3>
            <span className="text-xs text-muted-foreground">Delegate</span>
          </div>

          <div className="space-y-2 min-h-[200px]">
            {urgentNotImportant.length > 0 ? (
              urgentNotImportant.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectName={taskDetails[task.id]?.projectName}
                  sprintName={taskDetails[task.id]?.sprintName}
                  isDragging={draggedTask?.id === task.id}
                  onDragStart={handleDragStart}
                  onDragEnd={() => setDraggedTask(null)}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No tasks in this quadrant
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent
          className={`p-4 ${draggedTask && "border-2 border-dashed border-gray-500"}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "not-urgent-not-important")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-500">Not Urgent & Not Important</h3>
            <span className="text-xs text-muted-foreground">Eliminate</span>
          </div>

          <div className="space-y-2 min-h-[200px]">
            {notUrgentNotImportant.length > 0 ? (
              notUrgentNotImportant.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectName={taskDetails[task.id]?.projectName}
                  sprintName={taskDetails[task.id]?.sprintName}
                  isDragging={draggedTask?.id === task.id}
                  onDragStart={handleDragStart}
                  onDragEnd={() => setDraggedTask(null)}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No tasks in this quadrant
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
