"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { type Project, getProjects, generateId, addProject } from "@/lib/task-management"
import { ProjectCard } from "@/components/project-card"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { Plus, FolderPlus, Clock, Calendar, LayoutGrid } from "lucide-react"
import { QuickTaskInput } from "@/components/quick-task-input"
import { getDefaultProjectId } from "@/lib/default-project"

export default function PostPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("projects")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "employer") {
      router.push("/")
      return
    }

    // Load projects
    const userProjects = getProjects(user.id)
    setProjects(userProjects)
    setIsLoading(false)
  }, [user, router])

  const handleCreateProject = (name: string, description: string) => {
    const newProject: Project = {
      id: generateId(),
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ownerId: user?.id || "",
      sprints: [],
    }

    addProject(newProject)
    setProjects([...projects, newProject])
    setIsCreateDialogOpen(false)
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/post/project/${projectId}`)
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    )
  }

  return (
    <div className="container space-y-6 py-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Task Management</h1>
      </div>

      {/* Quick Task Input */}
      <QuickTaskInput
        userId={user?.id || ""}
        defaultProjectId={getDefaultProjectId(user?.id || "")}
        onTaskAdded={() => {
          // Refresh projects after quick task added
          const userProjects = getProjects(user?.id || "")
          setProjects(userProjects)
        }}
      />

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">
            <FolderPlus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Projects</span>
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Clock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Recent</span>
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="board">
            <LayoutGrid className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Board</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onClick={() => handleProjectClick(project.id)} />
            ))}

            <Card
              className="cursor-pointer border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <CardContent className="flex flex-col items-center justify-center h-40 p-6">
                <Plus className="h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">Create New Project</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-center">
            <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-1">Recent Tasks</h3>
            <p className="text-sm text-muted-foreground">Your recently viewed and edited tasks will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-center">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-1">Calendar View</h3>
            <p className="text-sm text-muted-foreground">View your tasks in a calendar format</p>
          </div>
        </TabsContent>

        <TabsContent value="board" className="mt-4">
          <div className="rounded-lg border bg-card p-6 text-center">
            <LayoutGrid className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-1">Board View</h3>
            <p className="text-sm text-muted-foreground">View your tasks in a kanban board format</p>
          </div>
        </TabsContent>
      </Tabs>

      <CreateProjectDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Floating Action Button for quick task creation */}
      <div className="fixed bottom-20 right-4 z-10">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg relative post-button-glow"
          onClick={() => {
            const defaultProjectId = getDefaultProjectId(user?.id || "")
            if (defaultProjectId) {
              router.push(`/post/project/${defaultProjectId}/create-task`)
            } else {
              setIsCreateDialogOpen(true)
            }
          }}
        >
          <Plus className="h-6 w-6" />
          <span className="absolute inset-0 rounded-full animate-pulse-subtle bg-primary/20"></span>
        </Button>
      </div>
    </div>
  )
}
