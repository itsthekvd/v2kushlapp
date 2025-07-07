"use client"

import { useState, useEffect, useRef } from "react"
import type { Task } from "@/lib/task-management"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, AlertTriangle, Edit2, Save, X } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { updateTask } from "@/lib/task-management"
import { useToast } from "@/components/ui/use-toast"

interface ListViewProps {
  tasks: Task[]
  highlightTaskId?: string | null
}

type TaskPriority = "low" | "medium" | "high" | "urgent"
type TaskStatus = "draft" | "published" | "in_progress" | "review" | "completed" | "archived"

export function ListView({ tasks, highlightTaskId }: ListViewProps) {
  const [sortField, setSortField] = useState<keyof Task>("updatedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const highlightedTaskRef = useRef<HTMLTableRowElement>(null)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Task>>({})
  const { toast } = useToast()

  useEffect(() => {
    // Scroll to highlighted task if provided
    if (highlightTaskId && highlightedTaskRef.current) {
      highlightedTaskRef.current.scrollIntoView({ behavior: "smooth", block: "center" })

      // Add a flash animation to the highlighted task
      if (highlightedTaskRef.current) {
        highlightedTaskRef.current.classList.add("bg-primary/10")
        setTimeout(() => {
          if (highlightedTaskRef.current) {
            highlightedTaskRef.current.classList.remove("bg-primary/10")
          }
        }, 2000)
      }
    }
  }, [highlightTaskId, tasks])

  const handleSort = (field: keyof Task) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortField === "title") {
      return sortDirection === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
    }

    if (sortField === "priority") {
      const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 }
      return sortDirection === "asc"
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : priorityOrder[b.priority] - priorityOrder[a.priority]
    }

    if (sortField === "status") {
      const statusOrder = { draft: 0, published: 1, in_progress: 2, review: 3, completed: 4, archived: 5 }
      return sortDirection === "asc"
        ? statusOrder[a.status] - statusOrder[b.status]
        : statusOrder[b.status] - statusOrder[a.status]
    }

    if (sortField === "dueDate") {
      if (!a.dueDate) return sortDirection === "asc" ? 1 : -1
      if (!b.dueDate) return sortDirection === "asc" ? -1 : 1
      return sortDirection === "asc" ? a.dueDate - b.dueDate : b.dueDate - a.dueDate
    }

    return sortDirection === "asc"
      ? (a[sortField] as any) - (b[sortField] as any)
      : (b[sortField] as any) - (a[sortField] as any)
  })

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "low":
        return null
      case "medium":
        return <Clock className="h-3 w-3 text-blue-500" />
      case "high":
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case "urgent":
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      case "published":
        return <Badge className="bg-blue-500">Published</Badge>
      case "in_progress":
        return <Badge className="bg-yellow-500">In Progress</Badge>
      case "review":
        return <Badge className="bg-purple-500">Review</Badge>
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "archived":
        return <Badge variant="outline">Archived</Badge>
      default:
        return null
    }
  }

  const startEditing = (task: Task) => {
    setEditingTask(task.id)
    setEditValues({
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    })
  }

  const cancelEditing = () => {
    setEditingTask(null)
    setEditValues({})
  }

  const saveEditing = async (taskId: string) => {
    if (!editValues) return

    try {
      const success = await updateTask(taskId, editValues)
      if (success) {
        toast({
          title: "Task updated",
          description: "Task details have been updated successfully",
        })
        setEditingTask(null)
        setEditValues({})
      } else {
        throw new Error("Failed to update task")
      }
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error updating task",
        description: "There was an error updating the task",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
              Task
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
              Status
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("priority")}>
              Priority
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("dueDate")}>
              Due Date
            </TableHead>
            <TableHead className="cursor-pointer text-right" onClick={() => handleSort("updatedAt")}>
              Last Updated
            </TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.length > 0 ? (
            sortedTasks.map((task) => {
              const isHighlighted = task.id === highlightTaskId
              const isEditing = editingTask === task.id

              return (
                <TableRow
                  key={task.id}
                  ref={isHighlighted ? highlightedTaskRef : null}
                  className={`transition-all duration-500 ${isHighlighted ? "bg-primary/10" : ""}`}
                >
                  <TableCell className="font-medium">
                    {isEditing ? (
                      <Input
                        value={editValues.title || ""}
                        onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {task.title}
                        {task.isPublished && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select
                        value={editValues.status || task.status}
                        onValueChange={(value) => setEditValues({ ...editValues, status: value as TaskStatus })}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getStatusBadge(task.status)
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select
                        value={editValues.priority || task.priority}
                        onValueChange={(value) => setEditValues({ ...editValues, priority: value as TaskPriority })}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-1">
                        {getPriorityIcon(task.priority)}
                        <span className="capitalize">{task.priority}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-8 w-[130px] justify-start text-left font-normal",
                              !editValues.dueDate && !task.dueDate && "text-muted-foreground",
                            )}
                          >
                            <Clock className="mr-2 h-3 w-3" />
                            {editValues.dueDate
                              ? format(new Date(editValues.dueDate), "MMM d, yyyy")
                              : task.dueDate
                                ? format(new Date(task.dueDate), "MMM d, yyyy")
                                : "No due date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={editValues.dueDate ? new Date(editValues.dueDate) : undefined}
                            onSelect={(date) =>
                              setEditValues({ ...editValues, dueDate: date ? date.getTime() : undefined })
                            }
                            initialFocus
                          />
                          <div className="flex justify-center p-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditValues({ ...editValues, dueDate: undefined })}
                            >
                              Clear
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span>{task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "—"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{format(new Date(task.updatedAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => saveEditing(task.id)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(task)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No tasks found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
