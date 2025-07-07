"use client"
import type { Task } from "@/lib/task-management"
import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/task-card"
import { updateTaskStatus, getSprintAndCampaignNames } from "@/lib/task-management"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import { CreateSpecialTaskDialog } from "@/components/create-special-task-dialog"

interface KanbanBoardProps {
  tasks: Task[]
  highlightTaskId?: string | null
  projectId?: string
  sprintId?: string
  campaignId?: string
}

export function KanbanBoard({ tasks, highlightTaskId, projectId, sprintId, campaignId }: KanbanBoardProps) {
  const highlightedTaskRef = useRef<HTMLDivElement>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [taskDetails, setTaskDetails] = useState<Record<string, { projectName?: string; sprintName?: string }>>({})
  const { toast } = useToast()
  const [specialTaskType, setSpecialTaskType] = useState<
    "checklist_library" | "credentials_library" | "brand_brief" | "resource_library" | null
  >(null)
  const [isCreateSpecialTaskOpen, setIsCreateSpecialTaskOpen] = useState(false)

  // Load project and sprint names for each task
  useEffect(() => {
    const details: Record<string, { projectName?: string; sprintName?: string }> = {}

    tasks.forEach((task) => {
      const names = getSprintAndCampaignNames(task.id)
      details[task.id] = names
    })

    setTaskDetails(details)
  }, [tasks])

  useEffect(() => {
    // Scroll to highlighted task if provided
    if (highlightTaskId && highlightedTaskRef.current) {
      highlightedTaskRef.current.scrollIntoView({ behavior: "smooth", block: "center" })

      // Add a flash animation to the highlighted task
      if (highlightedTaskRef.current) {
        highlightedTaskRef.current.classList.add("animate-pulse")
        setTimeout(() => {
          if (highlightedTaskRef.current) {
            highlightedTaskRef.current.classList.remove("animate-pulse")
          }
        }, 2000)
      }
    }
  }, [highlightTaskId, tasks])

  const columns = [
    { id: "to_do", name: "To Do", color: "bg-blue-500", isSpecial: false },
    { id: "doing", name: "Doing", color: "bg-yellow-500", isSpecial: false },
    { id: "done", name: "Done", color: "bg-green-500", isSpecial: false },
    { id: "recurring_daily", name: "Recurring Daily", color: "bg-purple-500", isSpecial: false },
    { id: "recurring_weekly", name: "Recurring Weekly", color: "bg-indigo-500", isSpecial: false },
    { id: "recurring_monthly", name: "Recurring Monthly", color: "bg-pink-500", isSpecial: false },
    { id: "blocked", name: "Blocked", color: "bg-red-500", isSpecial: false },
    { id: "checklist_library", name: "Checklist Library", color: "bg-emerald-500", isSpecial: true },
    { id: "credentials_library", name: "Credentials Library", color: "bg-cyan-500", isSpecial: true },
    { id: "brand_brief", name: "Brand Brief", color: "bg-amber-500", isSpecial: true },
    { id: "resource_library", name: "Resource Library", color: "bg-violet-500", isSpecial: true },
  ]

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    // Don't allow dragging tasks from special columns
    const specialColumns = ["checklist_library", "credentials_library", "brand_brief", "resource_library"]
    if (specialColumns.includes(task.status)) {
      e.preventDefault()
      toast({
        title: "Cannot move this task",
        description: "Tasks in special columns cannot be moved",
        variant: "destructive",
      })
      return
    }

    setDraggedTask(task)
    e.dataTransfer.setData("text/plain", task.id)

    // For better drag image (optional)
    if (e.dataTransfer.setDragImage && e.currentTarget) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20)
    }
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()

    // Don't allow dropping into special columns
    const specialColumns = ["checklist_library", "credentials_library", "brand_brief", "resource_library"]
    if (specialColumns.includes(columnId)) {
      e.dataTransfer.dropEffect = "none"
      return
    }

    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault()

    if (!draggedTask) return

    // Don't allow dropping into special columns
    const specialColumns = ["checklist_library", "credentials_library", "brand_brief", "resource_library"]
    if (specialColumns.includes(columnId)) {
      toast({
        title: "Cannot move to this column",
        description: "Regular tasks cannot be moved to special columns",
        variant: "destructive",
      })
      return
    }

    // Don't do anything if dropping in the same column
    if (draggedTask.status === columnId) return

    try {
      // Update the task status
      await updateTaskStatus(draggedTask.id, columnId as any)

      // Show success toast
      toast({
        title: "Task updated",
        description: `Task moved to ${columns.find((col) => col.id === columnId)?.name}`,
      })
    } catch (error) {
      console.error("Error updating task status:", error)
      toast({
        title: "Error updating task",
        description: "There was an error updating the task status",
        variant: "destructive",
      })
    }

    setDraggedTask(null)
  }

  const handleCreateSpecialTask = (
    type: "checklist_library" | "credentials_library" | "brand_brief" | "resource_library",
  ) => {
    if (!projectId || !sprintId || !campaignId) {
      toast({
        title: "Cannot create special task",
        description: "Missing project, sprint, or campaign information",
        variant: "destructive",
      })
      return
    }

    setSpecialTaskType(type)
    setIsCreateSpecialTaskOpen(true)
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[50vh]">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id)

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72"
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-medium">{column.name}</h3>
                </div>
                <Badge variant="outline">{columnTasks.length}</Badge>
              </div>

              <div
                className={`bg-secondary/30 rounded-lg p-2 min-h-[70vh] ${draggedTask && !column.isSpecial ? "border-2 border-dashed border-primary/50" : ""}`}
              >
                <div className="space-y-2">
                  {columnTasks.map((task) => {
                    const isHighlighted = task.id === highlightTaskId
                    const isDragging = draggedTask?.id === task.id

                    return (
                      <div
                        key={task.id}
                        ref={isHighlighted ? highlightedTaskRef : null}
                        className={`transition-all duration-500 ${isHighlighted ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      >
                        <TaskCard
                          task={task}
                          projectName={taskDetails[task.id]?.projectName}
                          sprintName={taskDetails[task.id]?.sprintName}
                          isDragging={isDragging}
                          onDragStart={handleDragStart}
                          onDragEnd={() => setDraggedTask(null)}
                          isSpecial={column.isSpecial}
                        />
                      </div>
                    )
                  })}

                  {columnTasks.length === 0 && (
                    <Card className="border-dashed border-secondary">
                      <CardContent className="p-4 text-center text-xs text-muted-foreground">No tasks</CardContent>
                    </Card>
                  )}

                  {/* Add "Create" button for special columns */}
                  {column.isSpecial && projectId && sprintId && campaignId && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => handleCreateSpecialTask(column.id as any)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add {column.name.replace(" Library", "")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dialog for creating special tasks */}
      {specialTaskType && (
        <CreateSpecialTaskDialog
          isOpen={isCreateSpecialTaskOpen}
          onClose={() => setIsCreateSpecialTaskOpen(false)}
          taskType={specialTaskType}
          projectId={projectId}
          sprintId={sprintId}
          campaignId={campaignId}
        />
      )}
    </>
  )
}
