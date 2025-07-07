"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getTaskById } from "@/lib/task-management"

interface SOPDisplayProps {
  taskId: string
  category?: string
}

// Helper function to get SOPs by category
const getSOPsByCategory = (category: string): any[] => {
  if (typeof window === "undefined") return []

  try {
    const sops = localStorage.getItem("kushl_standard_operating_procedures")
    if (!sops) return []

    const allSOPs = JSON.parse(sops)
    return allSOPs.filter((sop: any) => sop.category === category)
  } catch (error) {
    console.error("Error getting SOPs:", error)
    return []
  }
}

export function SOPDisplay({ taskId, category }: SOPDisplayProps) {
  const { user } = useAuth()
  const [sops, setSOPs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only load SOPs for students
    if (user?.userType !== "student" || !taskId) {
      setIsLoading(false)
      return
    }

    // Load SOPs from localStorage
    const loadSOPs = () => {
      setIsLoading(true)

      // If category is provided, use it directly
      if (category) {
        const categorySOPs = getSOPsByCategory(category)
        setSOPs(categorySOPs)
        setIsLoading(false)
        return
      }

      // Otherwise, get the task and use its category
      const task = getTaskById(taskId)
      if (task?.category) {
        const categorySOPs = getSOPsByCategory(task.category)
        setSOPs(categorySOPs)
      }

      setIsLoading(false)
    }

    loadSOPs()
  }, [user, taskId, category])

  // Only show to students and only if there are SOPs for this category
  if (user?.userType !== "student" || sops.length === 0) {
    return null
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <FileText className="h-4 w-4 mr-2 text-blue-500" />
          Standard Operating Procedures
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="animate-pulse h-16 bg-blue-100 rounded-md"></div>
          ) : (
            sops.map((sop) => (
              <div key={sop.id} className="flex items-start gap-3 p-3 bg-white rounded-md shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{sop.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {sop.category}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm whitespace-pre-line">{sop.content}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
