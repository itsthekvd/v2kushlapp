"use client"

import type { Sprint } from "@/lib/task-management"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckSquare } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

// Add a new prop for campaign creation
interface SprintCardProps {
  sprint: Sprint
  onClick: () => void
  onCreateCampaign?: (sprintId: string) => void
}

// Update the component to show campaigns and add campaign creation button
export function SprintCard({ sprint, onClick, onCreateCampaign }: SprintCardProps) {
  // Count total tasks across all campaigns
  const totalTasks = sprint.campaigns.reduce((acc, campaign) => {
    return acc + campaign.tasks.length
  }, 0)

  // Count completed tasks
  const completedTasks = sprint.campaigns.reduce((acc, campaign) => {
    return acc + campaign.tasks.filter((task) => task.status === "completed").length
  }, 0)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="cursor-pointer" onClick={onClick}>
            <h3 className="font-semibold">{sprint.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(sprint.startDate), "MMM d")} - {format(new Date(sprint.endDate), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>

        {sprint.description && <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{sprint.description}</p>}

        {/* Show campaigns */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Campaigns</h4>
            {onCreateCampaign && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateCampaign(sprint.id)
                }}
              >
                + Add
              </Button>
            )}
          </div>

          {sprint.campaigns.length > 0 ? (
            <div className="space-y-1">
              {sprint.campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="text-xs p-2 bg-secondary/30 rounded flex justify-between items-center"
                >
                  <span>{campaign.name}</span>
                  <Badge variant="outline" className="text-[10px] h-4">
                    {campaign.tasks.length} tasks
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No campaigns yet</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="flex items-center gap-1 text-xs">
          <CheckSquare className="h-3 w-3" />
          <span>
            {completedTasks}/{totalTasks} tasks
          </span>
        </div>

        <Badge variant="outline">{sprint.campaigns.length} campaigns</Badge>
      </CardFooter>
    </Card>
  )
}
