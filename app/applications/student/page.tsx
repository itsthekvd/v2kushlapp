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
import { ArrowLeft, Search, Clock, XCircle, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getProjects } from "@/lib/task-management"
import { findUserById } from "@/lib/storage"
import { formatDistanceToNow } from "date-fns"

export default function StudentApplicationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [applications, setApplications] = useState<any[]>([])
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Redirect if not logged in or not a student
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "student") {
      router.push("/dashboard")
      return
    }
  }, [user, router])

  // Load all applications for this student
  useEffect(() => {
    if (!user) return

    const loadApplications = () => {
      setIsLoading(true)
      try {
        // Get all projects
        const projects = getProjects("all")
        const studentApplications: any[] = []

        // Loop through all projects, sprints, campaigns, and tasks to find applications
        projects.forEach((project) => {
          project.sprints.forEach((sprint) => {
            sprint.campaigns.forEach((campaign) => {
              campaign.tasks.forEach((task) => {
                if (task.applications && task.applications.length > 0) {
                  // Find applications for this student
                  const studentApps = task.applications.filter((app: any) => app.studentId === user.id)

                  if (studentApps.length > 0) {
                    // Get employer info
                    const employer = findUserById(project.ownerId)

                    // Add task and employer details to each application
                    studentApps.forEach((application: any) => {
                      studentApplications.push({
                        ...application,
                        taskId: task.id,
                        taskTitle: task.title,
                        taskPrice: task.price,
                        projectName: project.name,
                        sprintName: sprint.name,
                        employerId: project.ownerId,
                        employerName: employer?.fullName || "Employer",
                        employerLogo: employer?.profile?.companyLogo,
                      })
                    })
                  }
                }
              })
            })
          })
        })

        // Sort applications by date (newest first)
        studentApplications.sort((a, b) => b.createdAt - a.createdAt)
        setApplications(studentApplications)
        filterApplications(studentApplications, searchQuery, activeTab)
      } catch (error) {
        console.error("Error loading applications:", error)
        toast({
          title: "Error",
          description: "Failed to load your applications. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadApplications()
  }, [user, toast, searchQuery])

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
          app.taskTitle.toLowerCase().includes(lowerQuery) ||
          app.employerName.toLowerCase().includes(lowerQuery) ||
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

  // Handle view task
  const handleViewTask = (taskId: string) => {
    router.push(`/opportunity/${taskId}`)
  }

  // Handle view employer profile
  const handleViewEmployerProfile = (employerId: string) => {
    router.push(`/profile/${employerId}`)
  }

  // Handle view timeline (for approved applications)
  const handleViewTimeline = (taskId: string) => {
    router.push(`/opportunity/${taskId}/timeline`)
  }

  if (!user) return null

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">My Applications</h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
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
          {filteredApplications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Employer info */}
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar
                      className="h-10 w-10 cursor-pointer"
                      onClick={() => handleViewEmployerProfile(application.employerId)}
                    >
                      {application.employerLogo ? (
                        <AvatarImage
                          src={application.employerLogo || "/placeholder.svg"}
                          alt={application.employerName}
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {application.employerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-left"
                          onClick={() => handleViewEmployerProfile(application.employerId)}
                        >
                          {application.employerName}
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
                      <div className="flex items-center gap-2">
                        {application.status === "pending" && (
                          <div className="flex items-center text-yellow-500 text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            Awaiting response
                          </div>
                        )}
                        {application.status === "approved" && (
                          <Button size="sm" onClick={() => handleViewTimeline(application.taskId)}>
                            View Timeline
                          </Button>
                        )}
                        {application.status === "rejected" && (
                          <div className="flex items-center text-red-500 text-sm">
                            <XCircle className="h-4 w-4 mr-1" />
                            Not selected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No applications found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query"
              : activeTab === "pending"
                ? "You don't have any pending applications"
                : activeTab === "approved"
                  ? "You don't have any approved applications yet"
                  : activeTab === "rejected"
                    ? "You don't have any rejected applications"
                    : "You haven't applied to any tasks yet"}
          </p>
          <Button className="mt-4" onClick={() => router.push("/explore")}>
            Browse Opportunities
          </Button>
        </div>
      )}
    </div>
  )
}
