"use client"

import type { Project } from "@/lib/task-management"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FolderOpen, Calendar } from "lucide-react"

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  // Ensure sprints exists before trying to reduce
  const sprints = project.sprints || []

  // Count total tasks across all sprints and campaigns
  const totalTasks = sprints.reduce((acc, sprint) => {
    return (
      acc +
      (sprint.campaigns || []).reduce((campaignAcc, campaign) => {
        return campaignAcc + (campaign.tasks || []).length
      }, 0)
    )
  }, 0)

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{project.name}</h3>
              <p className="text-xs text-muted-foreground">Updated {formatDate(project.updatedAt)}</p>
            </div>
          </div>
        </div>

        {project.description && (
          <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="flex items-center gap-1 text-xs">
          <Calendar className="h-3 w-3" />
          <span>{sprints.length} sprints</span>
        </div>

        <Badge variant="outline">{totalTasks} tasks</Badge>
      </CardFooter>
    </Card>
  )
}
