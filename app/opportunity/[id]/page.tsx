"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useGamification } from "@/contexts/gamification-context"
import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Clock,
  MapPin,
  Award,
  Share2,
  Bookmark,
  Edit,
  AlertCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
  User,
  IndianRupee,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  getYouTubeEmbedUrl,
  getTaskById,
  getSprintAndCampaignNames,
  addCommentToTask,
  updateTask,
  TASK_CATEGORIES,
  getCommissionPercentage,
  submitTaskApplication,
  getStudentApplication,
  updateApplicationStatus,
  type TaskApplication,
  canStudentApplyForTask,
  debugTaskAssignment,
  calculateStudentEarnings as calculateStudentEarningsUtil,
} from "@/lib/task-management"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculatePlatformCommission, CURRENCY } from "@/lib/constants"
import { ApplicationDialog } from "@/components/application-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { findUserById } from "@/lib/storage"

export default function TaskDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { unlockAchievement } = useGamification()
  const { toast } = useToast()
  const [isApplying, setIsApplying] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [task, setTask] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [comment, setComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editedTask, setEditedTask] = useState<any>(null)
  const [projectInfo, setProjectInfo] = useState<{ projectName?: string; sprintName?: string; projectId?: string }>({})
  const [sop, setSop] = useState<any>(null)
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false)
  const [studentApplication, setStudentApplication] = useState<TaskApplication | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("details")
  const [taskOwner, setTaskOwner] = useState<any>(null)

  useEffect(() => {
    // Load task
    const taskData = getTaskById(id as string)

    if (taskData) {
      setTask(taskData)
      setEditedTask({ ...taskData }) // Initialize edited task with current values

      // Get project info
      const info = getSprintAndCampaignNames(id as string)
      setProjectInfo(info)

      // Load task owner
      if (taskData.ownerId || taskData.employerId) {
        const ownerId = taskData.ownerId || taskData.employerId
        const owner = findUserById(ownerId)
        if (owner) {
          console.log("Loaded task owner:", owner) // Debug log
          setTaskOwner(owner)
        } else {
          console.log("Owner not found for ID:", ownerId) // Debug log
        }
      }

      // Load SOP if task has a category
      if (taskData.category) {
        const storedSops = localStorage.getItem("kushl_standard_operating_procedures")
        if (storedSops) {
          try {
            const parsedSops = JSON.parse(storedSops)
            // Find SOP for this category
            const matchingSop = parsedSops.find((s: any) => s.category === taskData.category)
            if (matchingSop) {
              setSop(matchingSop)
            }
          } catch (error) {
            console.error("Error parsing SOPs:", error)
          }
        }
      }

      // Load student application if user is a student
      if (user && user.userType === "student") {
        const application = getStudentApplication(id as string, user.id)
        setStudentApplication(application)
      }
    } else {
      // If task not found, redirect to explore page
      router.push("/explore")
    }

    setIsLoading(false)
  }, [id, router, user])

  // Show registration nudge for non-logged-in users
  useEffect(() => {
    if (!user) {
      toast({
        title: "Want to apply for this opportunity?",
        description: "Register as a student to apply for this opportunity",
        action: (
          <Button size="sm" onClick={() => router.push("/register/student")}>
            Register
          </Button>
        ),
        duration: 10000, // Show for 10 seconds
      })
    }
  }, [user, router, toast])

  const handleApply = () => {
    if (!user) {
      router.push("/login")
      return
    }

    // Check if student can apply for more tasks
    if (user.userType === "student") {
      const { canApply, reason } = canStudentApplyForTask(user.id)

      if (!canApply) {
        toast({
          title: "Cannot apply",
          description: reason || "You cannot apply for more tasks at this time.",
          variant: "destructive",
        })
        return
      }
    }

    // Open application dialog
    setIsApplicationDialogOpen(true)
  }

  const handleApplicationSubmit = async (note: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    setIsApplying(true)

    try {
      const success = await submitTaskApplication(id as string, user.id, user.fullName, user.email, note)

      if (success) {
        // Update local state
        setStudentApplication({
          id: "temp-id", // Will be replaced on reload
          studentId: user.id,
          studentName: user.fullName,
          studentEmail: user.email,
          note,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: "pending",
        })

        toast({
          title: "Application submitted",
          description: `You have successfully applied for the ${task.title} position.`,
        })

        // Unlock achievement for first application
        unlockAchievement("first_application")

        // Show achievement notification
        toast({
          title: "Achievement unlocked!",
          description: "Go-Getter: Apply for your first opportunity",
          action: (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Award className="h-4 w-4" />
            </div>
          ),
        })
      } else {
        throw new Error("Failed to submit application")
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      toast({
        title: "Error",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  const handleEditApplication = () => {
    if (studentApplication) {
      setIsApplicationDialogOpen(true)
    }
  }

  const handleSave = () => {
    setIsSaved(!isSaved)

    toast({
      title: isSaved ? "Removed from saved" : "Saved to your list",
      description: isSaved
        ? "This opportunity has been removed from your saved list"
        : "This opportunity has been saved to your list",
    })
  }

  const handleShare = () => {
    // Create a shareable URL
    const shareUrl = `${window.location.origin}/opportunity/${id}`

    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: task.title,
          text: `Check out this opportunity: ${task.title}`,
          url: shareUrl,
        })
        .then(() => {
          toast({
            title: "Shared successfully",
            description: "The opportunity has been shared",
          })
        })
        .catch((error) => {
          console.error("Error sharing:", error)
          // Fallback to clipboard
          copyToClipboard()
        })
    } else {
      // Fallback for browsers that don't support the Web Share API
      copyToClipboard()
    }

    // Helper function to copy to clipboard
    function copyToClipboard() {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          toast({
            title: "Link copied to clipboard",
            description: "Share this link with others",
          })
        })
        .catch((error) => {
          console.error("Error copying to clipboard:", error)
          toast({
            title: "Couldn't copy link",
            description: "Please copy the URL from your browser",
            variant: "destructive",
          })
        })
    }
  }

  const handleGoToTimeline = () => {
    // Debug the task assignment before navigating
    if (typeof window !== "undefined") {
      const debugInfo = debugTaskAssignment(id as string)
      console.log("Debug task assignment before navigation:", debugInfo)
    }

    // Use the correct URL format for the timeline
    router.push(`/opportunity/${id}/timeline`)
  }

  const handleSubmitComment = async () => {
    if (!comment.trim()) return

    setIsSubmittingComment(true)

    try {
      const success = await addCommentToTask(id as string, comment, user?.id || "", user?.fullName || "")

      if (success) {
        toast({
          title: "Comment added",
          description: "Your comment has been added successfully",
        })

        // Refresh task data
        const updatedTask = getTaskById(id as string)
        if (updatedTask) {
          setTask(updatedTask)
        }

        // Clear comment field
        setComment("")
      } else {
        throw new Error("Failed to add comment")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleEditTask = () => {
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    try {
      // Update the task
      const success = await updateTask(id as string, editedTask, user?.id || "", user?.fullName || "")

      if (success) {
        toast({
          title: "Task updated",
          description: "The task has been updated successfully",
        })

        // Update the task in state
        setTask(editedTask)

        // Close the dialog
        setIsEditDialogOpen(false)
      } else {
        throw new Error("Failed to update task")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleApproveApplication = async (applicationId: string) => {
    try {
      const success = await updateApplicationStatus(
        id as string,
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

        // Refresh task data
        const updatedTask = getTaskById(id as string)
        if (updatedTask) {
          setTask(updatedTask)
        }
      } else {
        throw new Error("Failed to approve application")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve application. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const success = await updateApplicationStatus(
        id as string,
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

        // Refresh task data
        const updatedTask = getTaskById(id as string)
        if (updatedTask) {
          setTask(updatedTask)
        }
      } else {
        throw new Error("Failed to reject application")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewEmployerProfile = () => {
    if (taskOwner) {
      router.push(`/profile/${taskOwner.id}`)
    }
  }

  const handleViewStudentProfile = (studentId: string) => {
    router.push(`/profile/${studentId}`)
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Task not found</h1>
        <Button onClick={() => router.push("/explore")}>Back to Explore</Button>
      </div>
    )
  }

  const isEmployer = user?.userType === "employer"
  const isStudent = user?.userType === "student"
  const isAdmin = user?.userType === "admin"
  const isTaskOwner = isEmployer && (task.ownerId === user?.id || task.employerId === user?.id)
  const hasAssignedStudent = !!task.assignment && task.assignment.status === "active"
  const isAssignedStudent = isStudent && (task.assigneeId === user?.id || task.assignedTo === user?.id)
  const hasApplied = !!studentApplication
  const isApplicationApproved = hasApplied && studentApplication?.status === "approved"
  const isApplicationRejected = hasApplied && studentApplication?.status === "rejected"
  const isApplicationPending = hasApplied && studentApplication?.status === "pending"
  const isTaskCompleted = task.status === "completed"

  // Determine if the current user should see the timeline button
  const canAccessTimeline = (isTaskOwner || isAssignedStudent || isAdmin) && (hasAssignedStudent || isTaskCompleted)

  return (
    <div className="container space-y-6 py-6 pb-20">
      <Button variant="ghost" size="sm" className="mb-2 -ml-2 h-8 px-2" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline" className="mb-2">
              {task.priority === "low"
                ? "Easy"
                : task.priority === "medium"
                  ? "Medium"
                  : task.priority === "high"
                    ? "Hard"
                    : "Urgent"}
            </Badge>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">
                Posted by{" "}
                {taskOwner ? (
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal text-primary hover:underline"
                    onClick={() => router.push(`/profile/${taskOwner.id}`)}
                  >
                    {taskOwner.fullName}
                  </Button>
                ) : (
                  "Employer"
                )}
                {projectInfo.projectName && ` • Project: ${projectInfo.projectName}`}
                {projectInfo.sprintName && ` • Sprint: ${projectInfo.sprintName}`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Avatar className="h-12 w-12 rounded-md cursor-pointer" onClick={handleViewEmployerProfile}>
              {taskOwner && taskOwner.profile?.companyLogo ? (
                <AvatarImage
                  src={taskOwner.profile.companyLogo || "/placeholder.svg"}
                  alt={taskOwner.fullName}
                  className="rounded-md object-cover"
                />
              ) : (
                <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                  {taskOwner ? taskOwner.fullName.charAt(0).toUpperCase() : "E"}
                </AvatarFallback>
              )}
            </Avatar>
            {taskOwner && taskOwner.profile?.companyName && (
              <span className="text-xs text-muted-foreground mt-1">{taskOwner.profile.companyName}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm">
            <Briefcase className="h-4 w-4" />
            <span>Remote</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm">
            <GraduationCap className="h-4 w-4" />
            <span>
              {task.priority === "low" ? "Entry Level" : task.priority === "medium" ? "Intermediate" : "Advanced"}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm">
            <Clock className="h-4 w-4" />
            <span>Posted {Math.floor((Date.now() - task.createdAt) / (1000 * 60 * 60 * 24))} days ago</span>
          </div>
          {isTaskCompleted && (
            <div className="flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-3 py-1.5 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Completed</span>
            </div>
          )}
        </div>

        {isEmployer && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Task Details</TabsTrigger>
              <TabsTrigger value="applications" className="relative">
                Applications
                {task.applications && task.applications.length > 0 && (
                  <Badge className="ml-2 bg-primary">{task.applications.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <TaskDetailsContent
                task={task}
                sop={sop}
                isEmployer={isEmployer}
                comment={comment}
                setComment={setComment}
                handleSubmitComment={handleSubmitComment}
                isSubmittingComment={isSubmittingComment}
                user={user}
              />
            </TabsContent>
            <TabsContent value="applications">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h2 className="font-semibold">Student Applications</h2>

                  {task.applications && task.applications.length > 0 ? (
                    <div className="space-y-4">
                      {task.applications.map((app: TaskApplication) => (
                        <div key={app.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar
                                className="h-8 w-8 cursor-pointer"
                                onClick={() => handleViewStudentProfile(app.studentId)}
                              >
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {app.studentName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-medium"
                                  onClick={() => handleViewStudentProfile(app.studentId)}
                                >
                                  {app.studentName}
                                </Button>
                                <p className="text-xs text-muted-foreground">{app.studentEmail}</p>
                              </div>
                            </div>
                            <Badge
                              className={
                                app.status === "approved"
                                  ? "bg-green-500"
                                  : app.status === "rejected"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                              }
                            >
                              {app.status === "approved"
                                ? "Approved"
                                : app.status === "rejected"
                                  ? "Rejected"
                                  : "Pending"}
                            </Badge>
                          </div>

                          <div className="bg-muted p-3 rounded-md mb-3">
                            <p className="text-sm">{app.note}</p>
                          </div>

                          <div className="flex justify-end gap-2">
                            {app.status === "pending" && !isTaskCompleted && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 border-red-200 hover:bg-red-50"
                                  onClick={() => handleRejectApplication(app.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => handleApproveApplication(app.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </>
                            )}
                            {app.status === "approved" && (
                              <Button size="sm" onClick={() => router.push(`/opportunity/${id}/timeline`)}>
                                Go to Timeline
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                      <p className="mt-2 text-muted-foreground">No applications yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!isEmployer && (
          <TaskDetailsContent
            task={task}
            sop={sop}
            isEmployer={isEmployer}
            comment={comment}
            setComment={setComment}
            handleSubmitComment={handleSubmitComment}
            isSubmittingComment={isSubmittingComment}
            user={user}
          />
        )}

        {/* Student Application Status */}
        {isStudent && hasApplied && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">Your Application</h2>
                <Badge
                  className={
                    isApplicationApproved ? "bg-green-500" : isApplicationRejected ? "bg-red-500" : "bg-yellow-500"
                  }
                >
                  {isApplicationApproved ? "Approved" : isApplicationRejected ? "Rejected" : "Pending"}
                </Badge>
              </div>

              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">{studentApplication?.note}</p>
              </div>

              <div className="flex justify-end">
                {isApplicationPending && !isTaskCompleted && (
                  <Button variant="outline" size="sm" onClick={handleEditApplication}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Application
                  </Button>
                )}
              </div>

              {isApplicationRejected && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <span className="font-medium">Application not approved.</span> Your application was not selected for
                    this task.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          {/* Action buttons based on user role and task status */}
          {isEmployer ? (
            <>
              {/* Employer actions */}
              {canAccessTimeline ? (
                <Button className="flex-1 h-12" onClick={handleGoToTimeline}>
                  Go to Timeline
                </Button>
              ) : (
                <Button className="flex-1 h-12" onClick={handleGoToTimeline} disabled={!hasAssignedStudent}>
                  {hasAssignedStudent ? "Go to Timeline" : "Timeline (Assign Student First)"}
                </Button>
              )}

              {isTaskOwner && !isTaskCompleted && (
                <Button variant="outline" size="icon" className="h-12 w-12" onClick={handleEditTask}>
                  <Edit className="h-5 w-5" />
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 relative share-button-glow"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
                <span className="absolute inset-0 rounded-md animate-pulse-subtle bg-primary/20"></span>
              </Button>
            </>
          ) : isAdmin ? (
            <>
              {/* Admin actions */}
              <Button className="flex-1 h-12" onClick={handleGoToTimeline}>
                Go to Timeline
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 relative share-button-glow"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
                <span className="absolute inset-0 rounded-md animate-pulse-subtle bg-primary/20"></span>
              </Button>
            </>
          ) : (
            <>
              {/* Student actions */}
              {isAssignedStudent ? (
                <Button className="flex-1 h-12" onClick={handleGoToTimeline}>
                  Go to Timeline
                </Button>
              ) : isTaskCompleted ? (
                <Button className="flex-1 h-12" disabled>
                  Task Completed
                </Button>
              ) : (
                <Button className="flex-1 h-12" onClick={handleApply} disabled={isApplying || hasApplied}>
                  {isApplying ? "Applying..." : hasApplied ? "Applied" : "Apply Now"}
                </Button>
              )}
              <Button variant="outline" size="icon" className="h-12 w-12" onClick={handleSave}>
                <Bookmark className={`h-5 w-5 ${isSaved ? "fill-primary" : ""}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 relative share-button-glow"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
                <span className="absolute inset-0 rounded-md animate-pulse-subtle bg-primary/20"></span>
              </Button>
            </>
          )}
        </div>

        {/* Timeline status message for employers */}
        {isEmployer && !hasAssignedStudent && !isTaskCompleted && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div>
              <span className="font-medium">Timeline is not active yet.</span> Assign a student to this task to activate
              the timeline feature.
            </div>
          </div>
        )}

        {isEmployer && hasAssignedStudent && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium mb-2 text-green-700">Timeline is active!</h3>
            <p className="text-sm text-green-600 mb-2">You can now communicate with the assigned student.</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-green-100 border-green-300 text-green-700 hover:bg-green-200"
                onClick={() => window.open(`/opportunity/${id}/timeline`, "_blank")}
              >
                Open Timeline in New Tab
              </Button>
              <p className="text-xs text-green-600">
                Direct link:{" "}
                <a href={`/opportunity/${id}/timeline`} target="_blank" className="underline" rel="noreferrer">
                  /opportunity/{id}/timeline
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Task completed message */}
        {isTaskCompleted && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <span className="font-medium">This task has been completed.</span>
              {canAccessTimeline && " You can still access the timeline to view the work history."}
            </div>
          </div>
        )}

        {/* Achievement hint for students */}
        {!isEmployer && !isAdmin && !user && !isTaskCompleted && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
            <Award className="h-5 w-5 text-primary" />
            <div>
              <span className="font-medium">Apply to unlock the Go-Getter achievement!</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedTask?.title || ""}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedTask?.description || ""}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={editedTask?.priority || "medium"}
                  onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedTask?.status || "draft"}
                  onValueChange={(value) => setEditedTask({ ...editedTask, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={editedTask?.category || TASK_CATEGORIES[0]}
                onValueChange={(value) => setEditedTask({ ...editedTask, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">YouTube Video URL</Label>
              <Input
                id="videoUrl"
                value={editedTask?.videoUrl || ""}
                onChange={(e) => setEditedTask({ ...editedTask, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ({CURRENCY})</Label>
              <Input
                id="price"
                type="number"
                min="100"
                value={editedTask?.price || 0}
                onChange={(e) => setEditedTask({ ...editedTask, price: Number.parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Platform commission: {calculatePlatformCommission(editedTask?.price || 0)} {CURRENCY} (
                {getCommissionPercentage(editedTask?.price || 0)}%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensation">Compensation (₹)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="minCompensation"
                  value={editedTask?.compensation?.amount || 500}
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask,
                      compensation: {
                        ...editedTask.compensation,
                        amount: Number.parseInt(e.target.value) || 0,
                        currency: "INR",
                      },
                    })
                  }
                  type="number"
                  placeholder="Min"
                />
                <span>-</span>
                <Input id="maxCompensation" value={1000} type="number" placeholder="Max" disabled />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Dialog */}
      <ApplicationDialog
        isOpen={isApplicationDialogOpen}
        onClose={() => setIsApplicationDialogOpen(false)}
        onSubmit={handleApplicationSubmit}
        initialNote={studentApplication?.note || ""}
        isEditing={!!studentApplication}
      />

      {/* Registration nudge for non-logged-in users */}
      {!user && (
        <div className="flex items-center gap-2 rounded-lg border border-primary p-4 mt-4 bg-primary/5">
          <div className="flex-1">
            <h3 className="font-medium">Want to apply for this opportunity?</h3>
            <p className="text-sm text-muted-foreground">Register as a student to apply for this opportunity</p>
          </div>
          <Button onClick={() => router.push("/register/student")}>Register Now</Button>
        </div>
      )}
    </div>
  )
}

// Extracted Task Details component to avoid duplication
function TaskDetailsContent({
  task,
  sop,
  isEmployer,
  comment,
  setComment,
  handleSubmitComment,
  isSubmittingComment,
  user,
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>Remote</span>
          </div>
          {/* Price display - show different amounts for employers and students */}
          {task.price && task.price > 0 && (
            <div className="flex items-center gap-2 text-lg font-semibold">
              <IndianRupee className="h-4 w-4" />
              {user?.userType === "student" ? calculateStudentEarningsUtil(task.price) : task.price}
            </div>
          )}
        </div>

        {task.videoUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-md">
            <iframe
              src={getYouTubeEmbedUrl(task.videoUrl)}
              title="Task Video"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        <div className="space-y-2">
          <h2 className="font-semibold">Description</h2>
          <p className="text-sm">{task.description || "No description provided"}</p>
        </div>

        {sop && !isEmployer && (
          <div className="space-y-2">
            <h2 className="font-semibold">Standard Operating Procedure</h2>
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{sop.title}</span>
                <a
                  href={sop.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View SOP
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Follow this standard operating procedure to complete the task efficiently.
              </p>
            </div>
          </div>
        )}

        {/* Comments section for employers */}
        {isEmployer && (
          <div className="space-y-4">
            <h2 className="font-semibold">Comments</h2>

            <div className="space-y-4">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment: any) => (
                  <div key={comment.id} className="border-b pb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              )}

              {task.status !== "completed" && (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={isSubmittingComment || !comment.trim()}
                    className="self-end"
                  >
                    {isSubmittingComment ? "Posting..." : "Post"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
