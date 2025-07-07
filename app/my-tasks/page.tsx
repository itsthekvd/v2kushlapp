"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { getProjects, type Task } from "@/lib/task-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CalendarIcon, LayoutGrid, List, Plus, Search, Grid } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProjectCard } from "@/components/project-card"
import { Card, CardContent } from "@/components/ui/card"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { KanbanBoard } from "@/components/kanban-board"
import { ListView } from "@/components/list-view"
import { CalendarView } from "@/components/calendar-view"
import { MatrixView } from "@/components/matrix-view"

export default function MyTasksPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null)
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("projects")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [taskView, setTaskView] = useState("kanban")
  const [projects, setProjects] = useState([])
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
  }, [user, router])

  // Load all tasks for this user
  useEffect(() => {
    if (!user) return

    const loadUserTasks = () => {
      setIsLoading(true)
      try {
        const userTasks: Task[] = []

        if (user.userType === "employer") {
          // Get all projects for this employer
          const employerProjects = getProjects(user.id)

          // Get all tasks from all projects
          employerProjects.forEach((project) => {
            project.sprints.forEach((sprint) => {
              sprint.campaigns.forEach((campaign) => {
                campaign.tasks.forEach((task) => {
                  userTasks.push({
                    ...task,
                    projectName: project.name,
                    sprintName: sprint.name,
                    projectId: project.id,
                    sprintId: sprint.id,
                    campaignId: campaign.id,
                  })
                })
              })
            })
          })
        } else if (user.userType === "student") {
          // Get all projects
          const allProjects = getProjects("all")

          // Find all tasks assigned to this student
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
                    userTasks.push({
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
        }

        setTasks(userTasks)
      } catch (error) {
        console.error("Error loading tasks:", error)
        toast({
          title: "Error",
          description: "Failed to load your tasks. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUserTasks()
  }, [user, toast])

  useEffect(() => {
    // Load projects here
    const loadProjects = () => {
      setIsLoading(true)
      try {
        if (!user) return

        let userProjects = []
        if (user.userType === "employer") {
          // For employers, get projects they own
          userProjects = getProjects(user.id)
        } else if (user.userType === "student") {
          // For students, get projects they're members of
          const allProjects = getProjects("all")
          userProjects = allProjects.filter((project) =>
            project.members && Array.isArray(project.members)
              ? project.members.some((member) => member && member.id === user.id)
              : false,
          )
        }

        setProjects(userProjects)
      } catch (error) {
        console.error("Error loading projects:", error)
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id) {
      loadProjects()
    }
  }, [user?.id, toast])

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
  }

  const filteredTasks = tasks.filter((task) => {
    const searchRegex = new RegExp(searchQuery, "i")
    const matchesSearch = searchRegex.test(task.title)

    const matchesStatus = statusFilter === "all" || task.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleProjectClick = (projectId: string) => {
    if (user?.userType === "employer") {
      router.push(`/post/project/${projectId}`)
    } else {
      router.push(`/project/${projectId}`)
    }
  }

  const handleCreateProject = (newProject: any) => {
    // Optimistically update the projects state
    setProjects((prevProjects) => [...prevProjects, newProject])
    setIsCreateProjectDialogOpen(false)
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
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">My Tasks</h1>
        </div>
        <Button onClick={() => setIsCreateProjectDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Project
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">All Tasks</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === "projects" ? "Search projects..." : "Search tasks..."}
              className="pl-8 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {activeTab === "tasks" && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="to_do">To Do</SelectItem>
                  <SelectItem value="doing">Doing</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  {/* Library item statuses */}
                  <SelectItem value="checklist_library">Checklist Library</SelectItem>
                  <SelectItem value="credentials_library">Credentials Library</SelectItem>
                  <SelectItem value="brand_brief">Brand Brief</SelectItem>
                  <SelectItem value="resource_library">Resource Library</SelectItem>
                  {/* Recurring task statuses */}
                  <SelectItem value="recurring_daily">Daily Tasks</SelectItem>
                  <SelectItem value="recurring_weekly">Weekly Tasks</SelectItem>
                  <SelectItem value="recurring_monthly">Monthly Tasks</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={taskView === "kanban" ? "default" : "ghost"}
                  size="icon"
                  className="h-10 w-10 rounded-none rounded-l-md"
                  onClick={() => setTaskView("kanban")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={taskView === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={() => setTaskView("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={taskView === "calendar" ? "default" : "ghost"}
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={() => setTaskView("calendar")}
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={taskView === "matrix" ? "default" : "ghost"}
                  size="icon"
                  className="h-10 w-10 rounded-none rounded-r-md"
                  onClick={() => setTaskView("matrix")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="projects" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onClick={() => handleProjectClick(project.id)} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <LayoutGrid className="h-12 w-12 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first project to start organizing your tasks
                </p>
                <Button className="mt-4" onClick={() => setIsCreateProjectDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : filteredTasks.length > 0 ? (
            <div>
              {taskView === "kanban" && <KanbanBoard tasks={filteredTasks} />}
              {taskView === "list" && <ListView tasks={filteredTasks} />}
              {taskView === "calendar" && <CalendarView tasks={filteredTasks} />}
              {taskView === "matrix" && <MatrixView tasks={filteredTasks} />}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <List className="h-12 w-12 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium">No tasks found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create a project and add tasks to get started"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button className="mt-4" onClick={() => setIsCreateProjectDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Project
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreateProjectDialog
        isOpen={isCreateProjectDialogOpen}
        onClose={() => setIsCreateProjectDialogOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
