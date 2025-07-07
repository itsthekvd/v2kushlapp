"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllPublishedTasks, updateTaskStatus, getCommissionPercentage } from "@/lib/task-management"
import { getUserById, findUserById } from "@/lib/storage"
import { Search, MoreHorizontal, Eye, MessageSquare, Clock, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

export default function AdminTasksPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<any[]>([])
  const [filteredTasks, setFilteredTasks] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load tasks data
  const loadTasksData = async () => {
    try {
      setIsLoading(true)
      setIsRefreshing(true)

      // Get all tasks from the task management system
      const allTasks = await getAllPublishedTasks()
      console.log(`Loaded ${allTasks.length} tasks`)

      // Enhance tasks with employer and student info
      const enhancedTasks = await Promise.all(
        allTasks.map(async (task) => {
          let employer = null
          let student = null

          // Fetch employer data - try both methods to ensure we get data
          if (task.employerId || task.ownerId) {
            const employerId = task.employerId || task.ownerId
            try {
              // First try getUserById
              employer = await getUserById(employerId)

              // If that doesn't work, try findUserById
              if (!employer || !employer.fullName) {
                const foundEmployer = findUserById(employerId)
                if (foundEmployer) {
                  employer = foundEmployer
                  console.log(`Found employer using findUserById for task ${task.id}:`, employer)
                }
              }

              console.log(`Fetched employer for task ${task.id}:`, employer)
            } catch (error) {
              console.error(`Error fetching employer for task ${task.id}:`, error)

              // Try findUserById as fallback
              try {
                const foundEmployer = findUserById(employerId)
                if (foundEmployer) {
                  employer = foundEmployer
                  console.log(`Found employer using findUserById for task ${task.id}:`, employer)
                }
              } catch (fallbackError) {
                console.error(`Fallback error fetching employer for task ${task.id}:`, fallbackError)
              }
            }
          }

          // Fetch student data - try both methods to ensure we get data
          if (task.assignedTo || task.assigneeId) {
            const studentId = task.assignedTo || task.assigneeId
            try {
              // First try getUserById
              student = await getUserById(studentId)

              // If that doesn't work, try findUserById
              if (!student || !student.fullName) {
                const foundStudent = findUserById(studentId)
                if (foundStudent) {
                  student = foundStudent
                  console.log(`Found student using findUserById for task ${task.id}:`, student)
                }
              }

              console.log(`Fetched student for task ${task.id}:`, student)
            } catch (error) {
              console.error(`Error fetching student for task ${task.id}:`, error)

              // Try findUserById as fallback
              try {
                const foundStudent = findUserById(studentId)
                if (foundStudent) {
                  student = foundStudent
                  console.log(`Found student using findUserById for task ${task.id}:`, student)
                }
              } catch (fallbackError) {
                console.error(`Fallback error fetching student for task ${task.id}:`, fallbackError)
              }
            }
          }

          // Calculate financial information
          const budget = task.price || task.budget || 0
          const commissionPercentage = getCommissionPercentage(budget)
          const platformCharge = Math.round((budget * commissionPercentage) / 100)
          const studentEarning = budget - platformCharge

          return {
            ...task,
            employerId: task.employerId || task.ownerId || "",
            employerName: employer?.fullName || employer?.name || employer?.displayName || "Unknown",
            employerEmail: employer?.email || "",
            assignedTo: task.assignedTo || task.assigneeId || "",
            studentName: student?.fullName || student?.name || student?.displayName || "Unassigned",
            studentEmail: student?.email || "",
            budget: budget,
            platformCharge,
            studentEarning,
          }
        }),
      )

      console.log("Enhanced tasks:", enhancedTasks)
      setTasks(enhancedTasks)
      setFilteredTasks(enhancedTasks)
    } catch (error) {
      console.error("Error loading tasks data:", error)
      toast({
        title: "Error",
        description: "Failed to load tasks data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "admin") {
      router.push("/")
      return
    }

    loadTasksData()

    // Refresh data every 5 minutes
    const intervalId = setInterval(loadTasksData, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [user, router, toast])

  useEffect(() => {
    // Apply filters
    let result = [...tasks]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (task) =>
          task.title?.toLowerCase().includes(query) ||
          task.employerName?.toLowerCase().includes(query) ||
          task.studentName?.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((task) => {
        if (!task.status) return false

        // Handle different status formats
        if (
          statusFilter === "to_do" &&
          (task.status === "to_do" || task.status === "to-do" || task.status === "To Do")
        ) {
          return true
        }
        if (
          statusFilter === "in_progress" &&
          (task.status === "in_progress" || task.status === "in-progress" || task.status === "In Progress")
        ) {
          return true
        }
        if (statusFilter === "completed" && (task.status === "completed" || task.status === "Completed")) {
          return true
        }
        return task.status.toLowerCase() === statusFilter.toLowerCase()
      })
    }

    setFilteredTasks(result)
  }, [searchQuery, statusFilter, tasks])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
  }

  const handleViewTask = (taskId: string) => {
    router.push(`/task/${taskId}`)
  }

  const handleViewTimeline = (taskId: string) => {
    router.push(`/task/${taskId}/timeline`)
  }

  const handleChangeStatus = (task: any) => {
    setSelectedTask(task)
    setNewStatus(task.status)
    setIsStatusDialogOpen(true)
  }

  const confirmStatusChange = async () => {
    if (!selectedTask || newStatus === selectedTask.status) {
      setIsStatusDialogOpen(false)
      return
    }

    try {
      const success = await updateTaskStatus(selectedTask.id, newStatus)

      if (success) {
        toast({
          title: "Status Updated",
          description: `Task status has been updated to ${newStatus}.`,
        })

        // Update local state
        setTasks((prev) => prev.map((task) => (task.id === selectedTask.id ? { ...task, status: newStatus } : task)))
      } else {
        toast({
          title: "Error",
          description: "Failed to update task status. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }

    setIsStatusDialogOpen(false)
  }

  const getStatusBadge = (status: string) => {
    // Check if status is undefined or null
    if (!status) {
      return <Badge variant="outline">Unknown</Badge>
    }

    // Normalize status for comparison
    const normalizedStatus = status.toLowerCase().replace("-", "_")

    switch (normalizedStatus) {
      case "to_do":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            To Do
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            In Progress
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleRefresh = () => {
    loadTasksData()
  }

  const formatDueDate = (dueDate: any) => {
    if (!dueDate) return "No deadline"

    try {
      // Handle string dates
      if (typeof dueDate === "string") {
        const date = new Date(dueDate)
        if (isNaN(date.getTime())) return "Invalid date"
        return date.toLocaleDateString()
      }

      // Handle number timestamps
      if (typeof dueDate === "number") {
        const date = new Date(dueDate)
        if (isNaN(date.getTime())) return "Invalid date"
        return date.toLocaleDateString()
      }

      // Handle Date objects
      if (dueDate instanceof Date) {
        if (isNaN(dueDate.getTime())) return "Invalid date"
        return dueDate.toLocaleDateString()
      }

      return "No deadline"
    } catch (error) {
      console.error("Error formatting due date:", error)
      return "No deadline"
    }
  }

  if (!user || user.userType !== "admin") {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => router.push("/admin/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." className="pl-8" value={searchQuery} onChange={handleSearch} />
        </div>
        <div className="w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="to_do">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <ScrollArea className="w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Task</TableHead>
                      <TableHead className="min-w-[150px]">Employer</TableHead>
                      <TableHead className="min-w-[150px]">Student</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Due Date</TableHead>
                      <TableHead className="min-w-[100px]">Employer Budget</TableHead>
                      <TableHead className="min-w-[120px]">Platform Charges</TableHead>
                      <TableHead className="min-w-[100px]">Student Earning</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No tasks found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">
                            <Link href={`/task/${task.id}`} className="text-blue-600 hover:underline">
                              {task.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {task.employerId ? (
                              <Link href={`/profile/${task.employerId}`} className="text-blue-600 hover:underline">
                                {task.employerName}
                              </Link>
                            ) : (
                              "Unknown"
                            )}
                          </TableCell>
                          <TableCell>
                            {task.assignedTo ? (
                              <Link href={`/profile/${task.assignedTo}`} className="text-blue-600 hover:underline">
                                {task.studentName}
                              </Link>
                            ) : (
                              "Unassigned"
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(task.status)}</TableCell>
                          <TableCell>{formatDueDate(task.dueDate)}</TableCell>
                          <TableCell>{task.budget > 0 ? `₹${task.budget.toLocaleString()}` : "N/A"}</TableCell>
                          <TableCell>
                            {task.budget > 0 ? (
                              <div>
                                <span className="font-medium">₹{task.platformCharge.toLocaleString()}</span>
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>{task.budget > 0 ? `₹${task.studentEarning.toLocaleString()}` : "N/A"}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewTask(task.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Task
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewTimeline(task.id)}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  View Timeline
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeStatus(task)}>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Change Status
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Task Status</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4">
              <Clock className="h-10 w-10 text-blue-500" />
              <div>
                <p className="font-medium">{selectedTask?.title}</p>
                <p className="text-sm text-muted-foreground">Current status: {getStatusBadge(selectedTask?.status)}</p>
              </div>
            </div>
            <div className="mt-4">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_do">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
