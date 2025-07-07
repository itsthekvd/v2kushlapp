"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Calendar, Grid, List, LayoutGrid, CheckCircle } from "lucide-react"
import { KanbanBoard } from "@/components/kanban-board"
import { CalendarView } from "@/components/calendar-view"
import { MatrixView } from "@/components/matrix-view"
import { ListView } from "@/components/list-view"
import { FloatingActionMenu } from "@/components/floating-action-menu"
import type { Task, TaskView } from "@/lib/task-management"

interface SharedTaskViewProps {
  title: string
  description?: string
  tasks: Task[]
  backLink: string
  projectId?: string
  sprintId?: string
  campaignId?: string
  userType: "employer" | "student"
  highlightTaskId?: string | null
  successMessage?: string | null
  showSprints?: boolean
  showFloatingMenu?: boolean
  onCreateTask?: () => void
}

export function SharedTaskView({
  title,
  description,
  tasks,
  backLink,
  projectId,
  sprintId,
  campaignId,
  userType,
  highlightTaskId = null,
  successMessage = null,
  showSprints = false,
  showFloatingMenu = true,
  onCreateTask,
}: SharedTaskViewProps) {
  const router = useRouter()
  const [view, setView] = useState<TaskView>("kanban")

  // Set view from URL parameter if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const viewParam = urlParams.get("view") as TaskView | null
    if (viewParam && ["kanban", "list", "calendar", "matrix"].includes(viewParam)) {
      setView(viewParam)
    }
  }, [])

  // Update URL when view changes
  const handleViewChange = (newView: TaskView) => {
    setView(newView)

    // Update URL without refreshing the page
    const url = new URL(window.location.href)
    url.searchParams.set("view", newView)
    window.history.pushState({}, "", url)
  }

  return (
    <div className="container space-y-6 py-6 pb-20">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push(backLink)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {description && <p className="text-muted-foreground">{description}</p>}

      {/* Success message for task creation */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={view} onValueChange={(value) => handleViewChange(value as TaskView)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kanban">
            <LayoutGrid className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Kanban</span>
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">List</span>
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="matrix">
            <Grid className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Matrix</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {view === "kanban" && (
          <KanbanBoard
            tasks={tasks}
            highlightTaskId={highlightTaskId}
            projectId={projectId}
            sprintId={sprintId}
            campaignId={campaignId}
          />
        )}
        {view === "list" && <ListView tasks={tasks} highlightTaskId={highlightTaskId} />}
        {view === "calendar" && <CalendarView tasks={tasks} />}
        {view === "matrix" && <MatrixView tasks={tasks} projectId={projectId} />}
      </div>

      {/* Conditionally render the floating action menu */}
      {showFloatingMenu && projectId && <FloatingActionMenu projectId={projectId} />}
    </div>
  )
}
