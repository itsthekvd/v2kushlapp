"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, ArrowLeft, User, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getProjects, updateApplicationStatus } from "@/lib/task-management"
import { findUserById } from "@/lib/storage"
import { formatDistanceToNow } from "date-fns"

function EmployerApplicationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [applications, setApplications] = useState<any[]>([])
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("pending")

  // Load all applications for this employer
  useEffect(() => {
    if (!user) return

    const loadApplications = () => {
      setIsLoading(true)
      try {
        // Get all projects for this employer
        const projects = getProjects(user.id)
        const allApplications: any[] = []

        // Loop through all projects, sprints, campaigns, and tasks to find applications
        projects.forEach((project) => {
          project.sprints.forEach((sprint) => {
            sprint.campaigns.forEach((campaign) => {
              campaign.tasks.forEach((task) => {
                if (task.applications && task.applications.length > 0) {
                  // Add task details to each application
                  task.applications.forEach((application) => {
                    allApplications.push({
                      ...application,
                      taskId: task.id,
                      taskTitle: task.title,
                      taskPrice: task.price,
                      projectName: project.name,
                      sprintName: sprint.name,
                    })
                  })
                }
              })
            })
          })
        })

        // Sort applications by date (newest first)
        allApplications.sort((a, b) => b.createdAt - a.createdAt)
        setApplications(allApplications)
        filterApplications(allApplications, searchQuery, activeTab)
      } catch (error) {
        console.error("Error loading applications:", error)
        toast({
          title: "Error",
          description: "Failed to load applications. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadApplications()
  }, [user, toast])

  // Filter applications based on search query and tab
  const filterApplications = (apps: any[], query: string, tab: string) => {
    let filtered = [...apps]

    // Filter by status
    if (tab !== "all") {
      filtered = filtered.filter((app) => app.status === tab)
    }

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.studentName.toLowerCase().includes(lowerQuery) ||
          app.taskTitle.toLowerCase().includes(lowerQuery) ||
          app.note.toLowerCase().includes(lowerQuery),
      )
    }

    setFilteredApplications(filtered)
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    filterApplications(applications, query, activeTab)
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    filterApplications(applications, searchQuery, value)
  }

  // Handle approve application
  const handleApprove = async (applicationId: string, taskId: string) => {
    try {
      const success = await updateApplicationStatus(
        taskId,
        applicationId,
        "approved",
        user?.id || "",
        user?.fullName || "",
      )

      if (success) {
        toast({
          title: "Application approved",
          description: "The student has been assigned to this task.",
        })

        // Update local state
        const updatedApplications = applications.map((app) => {
          if (app.id === applicationId) {
            return { ...app, status: "approved" }
          }
          return app
        })
        setApplications(updatedApplications)
        filterApplications(updatedApplications, searchQuery, activeTab)

        // Redirect to timeline
        router.push(`/opportunity/${taskId}/timeline`)
      } else {
        throw new Error("Failed to approve application")
      }
    } catch (error) {
      console.error("Error approving application:", error)
      toast({
        title: "Error",
        description: "Failed to approve application. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle reject application
  const handleReject = async (applicationId: string, taskId: string) => {
    try {
      const success = await updateApplicationStatus(
        taskId,
        applicationId,
        "rejected",
        user?.id || "",
        user?.fullName || "",
      )

      if (success) {
        toast({
          title: "Application rejected",
          description: "The application has been rejected.",
        })

        // Update local state
        const updatedApplications = applications.map((app) => {
          if (app.id === applicationId) {
            return { ...app, status: "rejected" }
          }
          return app
        })
        setApplications(updatedApplications)
        filterApplications(updatedApplications, searchQuery, activeTab)
      } else {
        throw new Error("Failed to reject application")
      }
    } catch (error) {
      console.error("Error rejecting application:", error)
      toast({
        title: "Error",
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle view student profile
  const handleViewStudentProfile = (studentId: string) => {
    router.push(`/profile/${studentId}`)
  }

  // Handle view task
  const handleViewTask = (taskId: string) => {
    router.push(`/opportunity/${taskId}`)
  }

  if (!user) return null

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Applications</h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            className="pl-8 w-full sm:w-[250px]"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const student = findUserById(application.studentId)
            return (
              <Card key={application.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Student info */}
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar
                        className="h-10 w-10 cursor-pointer"
                        onClick={() => handleViewStudentProfile(application.studentId)}
                      >
                        {student && student.profile?.profilePicture ? (
                          <AvatarImage
                            src={student.profile.profilePicture || "/placeholder.svg"}
                            alt={application.studentName}
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {application.studentName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium text-left"
                            onClick={() => handleViewStudentProfile(application.studentId)}
                          >
                            {application.studentName}
                          </Button>
                          <Badge
                            className={
                              application.status === "approved"
                                ? "bg-green-500"
                                : application.status === "rejected"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                            }
                          >
                            {application.status === "approved"
                              ? "Approved"
                              : application.status === "rejected"
                                ? "Rejected"
                                : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{application.studentEmail}</p>
                        <div className="mt-1">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm text-primary"
                            onClick={() => handleViewTask(application.taskId)}
                          >
                            {application.taskTitle}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            {application.projectName} • {application.sprintName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Application details */}
                    <div className="flex-1">
                      <div className="bg-muted p-3 rounded-md mb-2 text-sm">
                        <p className="line-clamp-3">{application.note}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Applied {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                        </span>
                        {application.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => handleReject(application.id, application.taskId)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleApprove(application.id, application.taskId)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        )}
                        {application.status === "approved" && (
                          <Button size="sm" onClick={() => router.push(`/opportunity/${application.taskId}/timeline`)}>
                            View Timeline
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground opacity-20" />
          <h3 className="mt-4 text-lg font-medium">No applications found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query"
              : activeTab === "pending"
                ? "You don't have any pending applications"
                : activeTab === "approved"
                  ? "You haven't approved any applications yet"
                  : activeTab === "rejected"
                    ? "You haven't rejected any applications yet"
                    : "You don't have any applications yet"}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ApplicationsPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType === "employer") {
      // Keep employers on this page
      // The employer applications page is implemented in this file
    } else if (user.userType === "student") {
      router.push("/applications/student")
    } else {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user) return null

  if (user.userType === "employer") {
    return <EmployerApplicationsPage />
  }

  return null
}
