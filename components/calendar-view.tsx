"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import type { Task } from "@/lib/task-management"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns"
import { updateTask } from "@/lib/task-management"
import { useToast } from "@/components/ui/use-toast"
import { getSprintAndCampaignNames } from "@/lib/task-management"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CalendarViewProps {
  tasks: Task[]
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [taskDetails, setTaskDetails] = useState<Record<string, { projectName?: string; sprintName?: string }>>({})
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
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

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return isSameDay(dueDate, date)
    })
  }

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = new Date(monthStart)
    const endDate = new Date(monthEnd)

    // Adjust to include days from previous/next month to fill the calendar grid
    startDate.setDate(startDate.getDate() - startDate.getDay())
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.setData("text/plain", task.id)
  }

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    if (!draggedTask) return

    try {
      // Update the task due date
      const success = await updateTask(draggedTask.id, {
        dueDate: date.getTime(),
        updatedAt: Date.now(),
      })

      if (success) {
        toast({
          title: "Due date updated",
          description: `Task due date changed to ${format(date, "MMMM d, yyyy")}`,
        })
        setSelectedDate(date)
      } else {
        throw new Error("Failed to update task due date")
      }
    } catch (error) {
      console.error("Error updating task due date:", error)
      toast({
        title: "Error updating due date",
        description: "There was an error updating the task due date",
        variant: "destructive",
      })
    }

    setDraggedTask(null)
  }

  // Render task item for calendar cell
  const renderTaskItem = (task: Task) => {
    const statusColors = {
      completed: "bg-green-500",
      in_progress: "bg-yellow-500",
      review: "bg-purple-500",
      published: "bg-blue-500",
      to_do: "bg-gray-500",
      doing: "bg-yellow-500",
      done: "bg-green-500",
    }

    const statusColor = statusColors[task.status as keyof typeof statusColors] || "bg-secondary"

    return (
      <div
        key={task.id}
        className={`text-xs p-1 mb-1 rounded truncate ${statusColor} bg-opacity-20 cursor-pointer`}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={() => setSelectedDate(new Date(task.dueDate!))}
      >
        {task.title}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Calendar header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-medium py-2">
            {day}
          </div>
        ))}

        {/* Calendar cells */}
        {calendarDays.map((day) => {
          const dayTasks = getTasksForDate(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <div
              key={day.toString()}
              className={`min-h-[100px] border p-1 ${
                isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
              } ${isSelected ? "ring-2 ring-primary" : ""} ${draggedTask ? "border-dashed border-primary" : ""}`}
              onClick={() => setSelectedDate(day)}
              onDragOver={(e) => handleDragOver(e, day)}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="font-medium text-right mb-1">{day.getDate()}</div>
              <div className="space-y-1 overflow-y-auto max-h-[80px]">
                {dayTasks.slice(0, 3).map((task) => renderTaskItem(task))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-center text-gray-500">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected date tasks detail */}
      {selectedDate && (
        <div className="mt-6">
          <h3 className="font-medium mb-4">Tasks for {format(selectedDate, "MMMM d, yyyy")}</h3>
          <div className="space-y-2">
            {getTasksForDate(selectedDate).length > 0 ? (
              getTasksForDate(selectedDate).map((task) => (
                <Card key={task.id} className="overflow-hidden" draggable onDragStart={(e) => handleDragStart(e, task)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {taskDetails[task.id]?.projectName && (
                            <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">
                              <span className="truncate max-w-[100px]">{taskDetails[task.id]?.projectName}</span>
                            </div>
                          )}
                          {taskDetails[task.id]?.sprintName && (
                            <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-sm">
                              <span className="truncate max-w-[100px]">{taskDetails[task.id]?.sprintName}</span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        )}
                      </div>

                      <Badge
                        className={
                          task.status === "completed"
                            ? "bg-green-500"
                            : task.status === "in_progress"
                              ? "bg-yellow-500"
                              : task.status === "review"
                                ? "bg-purple-500"
                                : task.status === "published"
                                  ? "bg-blue-500"
                                  : "bg-secondary"
                        }
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No tasks due on this date</div>
            )}
          </div>
        </div>
      )}

      {draggedTask && (
        <div className="mt-2 text-sm text-center text-muted-foreground">Drag task to a date to change its due date</div>
      )}
    </div>
  )
}
