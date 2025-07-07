"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getProjects } from "@/lib/task-management"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [projectData, setProjectData] = useState<any>(null)

  const loadProjectData = () => {
    const projects = getProjects("all")
    setProjectData(projects)
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50 opacity-50 hover:opacity-100"
        onClick={() => setIsOpen(true)}
      >
        Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-96 max-h-[80vh] overflow-auto shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">Debug Panel</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-xs">
        <Button variant="outline" size="sm" className="w-full mb-4" onClick={loadProjectData}>
          Load Project Data
        </Button>

        {projectData && (
          <div>
            <h3 className="font-bold mb-2">Projects ({projectData.length})</h3>
            {projectData.map((project: any) => {
              // Count total tasks
              let totalTasks = 0
              project.sprints.forEach((sprint: any) => {
                sprint.campaigns.forEach((campaign: any) => {
                  totalTasks += campaign.tasks.length
                })
              })

              return (
                <div key={project.id} className="mb-4 p-2 border rounded">
                  <p>
                    <span className="font-semibold">Name:</span> {project.name}
                  </p>
                  <p>
                    <span className="font-semibold">ID:</span> {project.id}
                  </p>
                  <p>
                    <span className="font-semibold">Sprints:</span> {project.sprints.length}
                  </p>
                  <p>
                    <span className="font-semibold">Total Tasks:</span> {totalTasks}
                  </p>

                  <div className="mt-2">
                    <h4 className="font-semibold">Sprints:</h4>
                    {project.sprints.map((sprint: any) => (
                      <div key={sprint.id} className="ml-2 mt-1">
                        <p>
                          {sprint.name} ({sprint.campaigns.length} campaigns)
                        </p>

                        <div className="ml-2">
                          {sprint.campaigns.map((campaign: any) => (
                            <div key={campaign.id} className="mt-1">
                              <p>
                                {campaign.name} ({campaign.tasks.length} tasks)
                              </p>

                              {campaign.tasks.length > 0 && (
                                <ul className="ml-2 list-disc">
                                  {campaign.tasks.map((task: any) => (
                                    <li key={task.id}>{task.title}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
