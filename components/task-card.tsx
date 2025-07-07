"use client"

import type { Task } from "@/lib/task-management"
import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, AlertCircle, Tag, CheckCircle, RotateCw } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toggleRecurringTaskCompletion } from "@/lib/task-management"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface TaskCardProps {
  task: Task
  projectName?: string
  sprintName?: string
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, task: Task) => void
  onDragEnd?: () => void
  isSpecial?: boolean
}

export function TaskCard({
  task,
  projectName,
  sprintName,
  isDragging = false,
  onDragStart,
  onDragEnd,
  isSpecial = false,
}: TaskCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [isCompletingRecurring, setIsCompletingRecurring] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  }

  const handleClick = () => {
    router.push(`/opportunity/${task.id}`)
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null
    return format(new Date(timestamp), "MMM d, yyyy")
  }

  const isRecurringTask = task.recurrenceType && task.status.startsWith("recurring_")
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.isRecurringCompleted

  const handleRecurringCompletion = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to complete tasks",
        variant: "destructive",
      })
      return
    }

    setIsCompletingRecurring(true)

    try {
      await toggleRecurringTaskCompletion(task.id, user.id, user.fullName)

      toast({
        title: task.isRecurringCompleted ? "Task marked as incomplete" : "Task completed",
        description: task.isRecurringCompleted
          ? "The task has been marked as incomplete"
          : "The task has been marked as completed",
      })
    } catch (error) {
      console.error("Error toggling recurring task completion:", error)
      toast({
        title: "Error",
        description: "There was an error updating the task",
        variant: "destructive",
      })
    } finally {
      setIsCompletingRecurring(false)
    }
  }

  return (
    <Card
      className={cn(
        "border shadow-sm transition-all duration-200",
        isDragging ? "opacity-50" : "opacity-100",
        isHovered ? "shadow-md" : "",
        isSpecial ? "border-l-4 border-l-primary" : "",
        isRecurringTask && task.isRecurringCompleted ? "bg-green-50" : "",
      )}
      draggable={!isSpecial}
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3
              className="font-medium line-clamp-2 cursor-pointer hover:text-primary transition-colors"
              onClick={handleClick}
            >
              {task.title}
            </h3>
            <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
          </div>

          {task.description && <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.labels.map((label) => (
                <Badge
                  key={label.id}
                  className="text-xs"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                    borderColor: `${label.color}40`,
                  }}
                  variant="outline"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Recurring task indicator */}
          {isRecurringTask && (
            <div className="flex items-center mt-2">
              <button
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full mr-2 transition-colors",
                  task.isRecurringCompleted
                    ? "bg-green-500 text-white"
                    : "border border-gray-300 hover:border-green-500",
                  isCompletingRecurring && "opacity-50",
                )}
                onClick={handleRecurringCompletion}
                disabled={isCompletingRecurring}
              >
                {isCompletingRecurring ? (
                  <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-current animate-spin"></div>
                ) : task.isRecurringCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : null}
              </button>
              <span className="text-xs flex items-center text-muted-foreground">
                <RotateCw className="h-3 w-3 mr-1" />
                {task.recurrenceType === "daily" ? "Daily" : task.recurrenceType === "weekly" ? "Weekly" : "Monthly"}{" "}
                recurring task
              </span>
            </div>
          )}

          {/* Special task type indicators */}
          {isSpecial && (
            <div className="mt-2">
              {task.status === "checklist_library" && (
                <div className="text-xs text-muted-foreground">{task.checklistItems?.length || 0} items</div>
              )}
              {task.status === "credentials_library" && (
                <div className="text-xs text-muted-foreground">{task.credentials?.length || 0} credentials</div>
              )}
              {task.status === "brand_brief" && (
                <div className="text-xs text-muted-foreground">{task.brandBrief?.brandName || "Brand brief"}</div>
              )}
              {task.status === "resource_library" && (
                <div className="text-xs text-muted-foreground">{task.resources?.length || 0} resources</div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <div className={cn("flex items-center", isOverdue ? "text-red-500 font-medium" : "")}>
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(task.dueDate)}
              {isOverdue && " (Overdue)"}
            </div>
          )}

          {task.nextDueDate && task.isRecurringCompleted && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Next: {formatDate(task.nextDueDate)}
            </div>
          )}

          {task.createdAt && !task.dueDate && !task.nextDueDate && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(task.createdAt)}
            </div>
          )}
        </div>

        {task.isPublished && (
          <Badge variant="secondary" className="text-xs">
            Published
          </Badge>
        )}

        {task.assignment && (
          <Badge variant="outline" className="text-xs">
            Assigned
          </Badge>
        )}

        {task.status === "blocked" && (
          <div className="flex items-center text-red-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            Blocked
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
