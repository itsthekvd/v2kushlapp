"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Send, MoreVertical, CheckCircle, RefreshCw, ChevronDown, Edit, Trash2, Lock } from "lucide-react"
import {
  getTaskById,
  addTimelineMessage,
  editTimelineMessage,
  deleteTimelineMessage,
  reassignTask,
  markTaskCompleted,
  hasUserSubmittedReview,
  updateTask,
} from "@/lib/task-management"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ReviewDialog } from "@/components/review-dialog"
import { SOPDisplay } from "@/components/sop-display"
import { getYouTubeEmbedUrl, getSprintAndCampaignNames } from "@/lib/task-management"

export default function TimelinePage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [task, setTask] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [reassignReason, setReassignReason] = useState("")
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 640px)")
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false)
  const [projectInfo, setProjectInfo] = useState<{ projectName?: string; sprintName?: string; projectId?: string }>({})

  // Status update options
  const statusOptions = [
    { value: "requirements_updated", label: "Requirements updated" },
    { value: "feedback_provided", label: "Feedback provided" },
    { value: "work_approved", label: "Work approved" },
  ]

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Load task data
    const loadTask = () => {
      const taskData = getTaskById(id as string)
      if (taskData) {
        // Debug the task assignment
        console.log("Timeline - Task loaded:", {
          id: taskData.id,
          title: taskData.title,
          hasAssignment: !!taskData.assignment,
          assignmentStatus: taskData.assignment?.status,
          assigneeId: taskData.assigneeId,
        })

        setTask(taskData)

        // Get project info
        const info = getSprintAndCampaignNames(id as string)
        setProjectInfo(info)

        // Check if this is a newly assigned task for a student
        if (
          taskData.assignment &&
          taskData.assignment.studentId === user.id &&
          user.userType === "student" &&
          !taskData.detailsPostedToTimeline
        ) {
          // Post task details to timeline
          postTaskDetailsToTimeline(taskData)
        }
      } else {
        router.push("/explore")
      }
      setIsLoading(false)
    }

    loadTask()

    // Set up interval to refresh task data
    const intervalId = setInterval(loadTask, 5000)

    return () => clearInterval(intervalId)
  }, [id, router, user])

  // Enhanced function to post ALL task details to timeline:
  const postTaskDetailsToTimeline = async (taskData: any) => {
    try {
      // Post task description
      if (taskData.description) {
        await addTimelineMessage(
          id as string,
          `📝 **Task Description**\n\n${taskData.description}`,
          "system",
          "System",
          "employer",
          true,
        )
      }

      // Post video if available
      if (taskData.videoUrl) {
        const embedUrl = getYouTubeEmbedUrl(taskData.videoUrl)
        await addTimelineMessage(
          id as string,
          `🎬 **Task Video**\n\n${embedUrl ? `Watch: ${taskData.videoUrl}` : taskData.videoUrl}`,
          "system",
          "System",
          "employer",
          true,
        )
      }

      // Post category if available
      if (taskData.category) {
        await addTimelineMessage(
          id as string,
          `🏷️ **Category**: ${taskData.category}`,
          "system",
          "System",
          "employer",
          true,
        )
      }

      // Post priority if available
      if (taskData.priority) {
        const priorityText =
          taskData.priority === "low"
            ? "Low (Easy)"
            : taskData.priority === "medium"
              ? "Medium"
              : taskData.priority === "high"
                ? "High (Hard)"
                : "Urgent"

        await addTimelineMessage(id as string, `⭐ **Priority**: ${priorityText}`, "system", "System", "employer", true)
      }

      // Post project context
      if (projectInfo.projectName || projectInfo.sprintName) {
        let contextMsg = "📋 **Project Context**\n\n"
        if (projectInfo.projectName) contextMsg += `Project: ${projectInfo.projectName}\n`
        if (projectInfo.sprintName) contextMsg += `Sprint: ${projectInfo.sprintName}`

        await addTimelineMessage(id as string, contextMsg, "system", "System", "employer", true)
      }

      // Post library items if available
      const hasLibraryItems =
        (taskData.checklistRefs && taskData.checklistRefs.length > 0) ||
        (taskData.credentialRefs && taskData.credentialRefs.length > 0) ||
        taskData.brandBriefRef ||
        (taskData.resourceRefs && taskData.resourceRefs.length > 0)

      if (hasLibraryItems) {
        await addTimelineMessage(
          id as string,
          "📚 **Required Resources & References**\n\nThe following resources have been automatically added to help you complete this task.",
          "system",
          "System",
          "employer",
          true,
        )
      }

      // Post each checklist
      if (taskData.checklistRefs && taskData.checklistRefs.length > 0) {
        for (const checklist of taskData.checklistRefs) {
          await addTimelineMessage(
            id as string,
            `📋 **Checklist: ${checklist.title}**\n\n${checklist.items
              .map((item: any, i: number) => `${i + 1}. ${item.text}`)
              .join("\n")}`,
            "system",
            "System",
            "employer",
            true,
          )
        }
      }

      // Post each credential set
      if (taskData.credentialRefs && taskData.credentialRefs.length > 0) {
        for (const credential of taskData.credentialRefs) {
          await addTimelineMessage(
            id as string,
            `🔑 **Credentials: ${credential.title}**\n\n${credential.credentials
              .map(
                (cred: any) =>
                  `Service: ${cred.service}\nUsername: ${cred.username}\nPassword: ${cred.password}${cred.notes ? `\nNotes: ${cred.notes}` : ""}`,
              )
              .join("\n\n")}`,
            "system",
            "System",
            "employer",
            true,
          )
        }
      }

      // Post brand brief if available
      if (taskData.brandBriefRef) {
        const brief = taskData.brandBriefRef
        await addTimelineMessage(
          id as string,
          `🎨 **Brand Brief: ${brief.title}**\n\nBrand Name: ${brief.brandBrief.brandName || "N/A"}
${brief.brandBrief.clientName ? `Client Name: ${brief.brandBrief.clientName}` : ""}
${brief.brandBrief.brandColors && brief.brandBrief.brandColors.length > 0 ? `Brand Colors: ${brief.brandBrief.brandColors.join(", ")}` : ""}
${brief.brandBrief.brandFonts && brief.brandBrief.brandFonts.length > 0 ? `Brand Fonts: ${brief.brandBrief.brandFonts.join(", ")}` : ""}
${brief.brandBrief.brandVoice ? `Brand Voice: ${brief.brandBrief.brandVoice}` : ""}
${brief.brandBrief.targetAudience ? `Target Audience: ${brief.brandBrief.targetAudience}` : ""}
${brief.brandBrief.keyMessages && brief.brandBrief.keyMessages.length > 0 ? `Key Messages:\n${brief.brandBrief.keyMessages.map((msg: string, i: number) => `${i + 1}. ${msg}`).join("\n")}` : ""}`,
          "system",
          "System",
          "employer",
          true,
        )
      }

      // Post resources if available
      if (taskData.resourceRefs && taskData.resourceRefs.length > 0) {
        for (const resource of taskData.resourceRefs) {
          await addTimelineMessage(
            id as string,
            `📚 **Resources: ${resource.title}**\n\n${resource.resources
              .map(
                (res: any) =>
                  `Name: ${res.name}\nType: ${res.type}\nURL: ${res.url}${res.description ? `\nDescription: ${res.description}` : ""}`,
              )
              .join("\n\n")}`,
            "system",
            "System",
            "employer",
            true,
          )
        }
      }

      // Post direct checklists if available (not from refs)
      if (taskData.checklists && taskData.checklists.length > 0) {
        for (const checklist of taskData.checklists) {
          await addTimelineMessage(
            id as string,
            `📋 **Checklist: ${checklist.title}**\n\n${checklist.items
              .map((item: any, i: number) => `${i + 1}. ${item.text}`)
              .join("\n")}`,
            "system",
            "System",
            "employer",
            true,
          )
        }
      }

      // Post labels if available
      if (taskData.labels && taskData.labels.length > 0) {
        const labelsText = taskData.labels.map((label: any) => label.name).join(", ")
        await addTimelineMessage(id as string, `🏷️ **Labels**: ${labelsText}`, "system", "System", "employer", true)
      }

      // Post skills if available
      if (taskData.skills && taskData.skills.length > 0) {
        const skillsText = taskData.skills.join(", ")
        await addTimelineMessage(
          id as string,
          `🧠 **Required Skills**: ${skillsText}`,
          "system",
          "System",
          "employer",
          true,
        )
      }

      // Post standard operating procedure if available
      if (taskData.standardOperatingProcedure) {
        await addTimelineMessage(
          id as string,
          `📑 **Standard Operating Procedure**\n\n${taskData.standardOperatingProcedure}`,
          "system",
          "System",
          "employer",
          true,
        )
      }

      // Post due date if available
      if (taskData.dueDate) {
        const dueDate = new Date(taskData.dueDate)
        await addTimelineMessage(
          id as string,
          `⏰ **Due Date**: ${dueDate.toLocaleDateString()}`,
          "system",
          "System",
          "employer",
          true,
        )
      }

      // Post welcome message
      await addTimelineMessage(
        id as string,
        "👋 **Welcome to the task timeline!**\n\nThis is where you can communicate with each other about the task. Feel free to ask questions, share updates, or provide feedback.",
        "system",
        "System",
        "employer",
        true,
      )

      // Mark details as posted
      await updateTask(id as string, { detailsPostedToTimeline: true })
    } catch (error) {
      console.error("Error posting task details to timeline:", error)
    }
  }

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [task?.timelineMessages])

  useEffect(() => {
    if (task && user) {
      const hasReviewed = hasUserSubmittedReview(task.id, user.id, user.userType)
      setHasSubmittedReview(hasReviewed)

      // Show review dialog for student if they haven't submitted a review yet and task is completed
      if (task.status === "completed" && !hasReviewed) {
        setShowReviewDialog(true)
      }
    }
  }, [task, user])

  const handleSendMessage = async () => {
    if (!message.trim() || task.status === "completed") return

    setIsSending(true)

    try {
      const success = await addTimelineMessage(
        id as string,
        message,
        user?.id || "",
        user?.fullName || "",
        user?.userType || "employer",
        false,
      )

      if (success) {
        // Clear message input
        setMessage("")

        // Refresh task data
        const updatedTask = getTaskById(id as string)
        if (updatedTask) {
          setTask(updatedTask)
        }
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editedContent.trim() || task.status === "completed") return

    try {
      const success = await editTimelineMessage(
        id as string,
        messageId,
        editedContent,
        user?.id || "",
        user?.fullName || "",
        user?.userType || "student",
      )

      if (success) {
        // Reset editing state
        setEditingMessageId(null)
        setEditedContent("")

        // Refresh task data
        const updatedTask = getTaskById(id as string)
        if (updatedTask) {
          setTask(updatedTask)
        }

        toast({
          title: "Message updated",
          description: "Your message has been updated successfully",
        })
      } else {
        throw new Error("Failed to edit message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to edit message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const confirmDeleteMessage = (messageId: string) => {
    if (task.status === "completed") return

    setMessageToDelete(messageId)
    setIsDeleteConfirmOpen(true)
  }

  const handleDeleteMessage = async () => {
    if (!messageToDelete || task.status === "completed") return

    try {
      const success = await deleteTimelineMessage(
        id as string,
        messageToDelete,
        user?.id || "",
        user?.fullName || "",
        user?.userType || "student",
      )

      if (success) {
        // Reset state
        setMessageToDelete(null)
        setIsDeleteConfirmOpen(false)

        // Refresh task data
        const updatedTask = getTaskById(id as string)
        if (updatedTask) {
          setTask(updatedTask)
        }

        toast({
          title: "Message deleted",
          description: "Your message has been deleted",
        })
      } else {
        throw new Error("Failed to delete message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (status: string) => {
    if (task.status === "completed") return

    try {
      // Add a system message about the status update
      const success = await addTimelineMessage(
        id as string,
        status,
        user?.id || "",
        user?.fullName || "",
        user?.userType || "employer",
        true,
      )

      if (success) {
        // Refresh task data
        const updatedTask = getTaskById(id as string)
        if (updatedTask) {
          setTask(updatedTask)
        }

        toast({
          title: "Status updated",
          description: `Status has been updated to "${status}"`,
        })
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMarkCompleted = async () => {
    if (task.status === "completed") return

    try {
      const success = await markTaskCompleted(id as string, user?.id || "", user?.fullName || "")

      if (success) {
        // Refresh task data
        const updatedTask = getTaskById(id as string)
        if (updatedTask) {
          setTask(updatedTask)
        }

        toast({
          title: "Task completed",
          description: "The task has been marked as completed",
        })

        // Show review dialog for the user who marked it complete
        setShowReviewDialog(true)
      } else {
        throw new Error("Failed to mark task as completed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark task as completed. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReassignTask = async () => {
    if (!reassignReason.trim() || task.status === "completed") return

    try {
      const success = await reassignTask(id as string, reassignReason, user?.id || "", user?.fullName || "")

      if (success) {
        // Reset state
        setReassignReason("")
        setIsReassignDialogOpen(false)

        // Refresh task data
        const updatedTask = getTaskById(id as string)
        if (updatedTask) {
          setTask(updatedTask)
        }

        toast({
          title: "Task reassigned",
          description: "The task has been reassigned and republished to the marketplace",
        })
      } else {
        throw new Error("Failed to reassign task")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reassign task. Please try again.",
        variant: "destructive",
      })
    }
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
  const hasAssignedStudent = !!task.assignment && task.assignment.status === "active"
  const isTaskCompleted = task.status === "completed"

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="border-b p-2 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/opportunity/${id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold">{task.title}</h1>
              <p className="text-sm text-muted-foreground">Timeline</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm">
            {hasAssignedStudent && (
              <>
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span>Connected</span>
              </>
            )}
            {isTaskCompleted && (
              <>
                <Lock className="h-3 w-3 mr-1 text-amber-500" />
                <span className="text-amber-500">Archived</span>
              </>
            )}
          </div>
        </div>

        {/* Mobile-optimized action buttons */}
        {isEmployer && hasAssignedStudent && !isTaskCompleted && (
          <div className="flex flex-wrap gap-2 mt-1">
            {isMobile ? (
              <>
                <Button variant="outline" size="sm" onClick={handleMarkCompleted} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="whitespace-nowrap">Mark Done</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <MoreVertical className="h-4 w-4 mr-1" />
                      <span className="whitespace-nowrap">More</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsReassignDialogOpen(true)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reassign Task
                    </DropdownMenuItem>
                    <DropdownMenuItem className="font-medium">Update Status</DropdownMenuItem>
                    {statusOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleUpdateStatus(option.label)}
                        className="pl-6"
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleMarkCompleted}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Completed
                </Button>

                <Button variant="outline" size="sm" onClick={() => setIsReassignDialogOpen(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reassign Task
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Update Status <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {statusOptions.map((option) => (
                      <DropdownMenuItem key={option.value} onClick={() => handleUpdateStatus(option.label)}>
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        )}
      </div>

      {/* SOP Display - Only visible to students */}
      {hasAssignedStudent && user?.userType === "student" && task.category && (
        <SOPDisplay taskId={id as string} category={task.category} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasAssignedStudent ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-muted rounded-full p-4 mb-4">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Timeline not active</h3>
            <p className="text-muted-foreground max-w-md">
              {isEmployer
                ? "Assign a student to this task to activate the timeline feature."
                : "This timeline will be active once you're assigned to this task."}
            </p>
          </div>
        ) : (
          <>
            {task.timelineMessages && task.timelineMessages.length > 0 ? (
              task.timelineMessages.map((msg: any) => {
                const isCurrentUser = msg.userId === user?.id
                const isEditing = editingMessageId === msg.id

                // System message
                if (msg.isSystemMessage) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">{msg.content}</div>
                    </div>
                  )
                }

                // Deleted message
                if (msg.isDeleted) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground italic">
                        This message was deleted
                      </div>
                    </div>
                  )
                }

                // Regular message
                return (
                  <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <div className="flex max-w-[80%]">
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                          <AvatarFallback>{msg.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}

                      <div>
                        {!isCurrentUser && (
                          <div className="text-xs text-muted-foreground mb-1">
                            {msg.userName} • {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                          </div>
                        )}

                        <div className="relative group">
                          {isEditing ? (
                            <div className="bg-background border rounded-lg p-2 min-w-[200px]">
                              <Textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="min-h-[80px] mb-2"
                                placeholder="Edit your message..."
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => setEditingMessageId(null)}>
                                  Cancel
                                </Button>
                                <Button size="sm" onClick={() => handleEditMessage(msg.id)}>
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`rounded-lg p-3 ${
                                isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}
                            >
                              <div className="whitespace-pre-wrap">{msg.content}</div>

                              <div className="text-xs mt-1 opacity-70 flex items-center">
                                <span>{formatDistanceToNow(msg.timestamp, { addSuffix: true })}</span>
                                {msg.edited && <span className="ml-1 italic text-xs opacity-70">(edited)</span>}
                              </div>
                            </div>
                          )}

                          {isCurrentUser && !isEditing && !isTaskCompleted && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-primary/10"
                                onClick={() => {
                                  setEditingMessageId(msg.id)
                                  setEditedContent(msg.content)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-primary/10 ml-1"
                                onClick={() => confirmDeleteMessage(msg.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex justify-center my-8">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      {hasAssignedStudent && (
        <div className="border-t p-4">
          {isTaskCompleted ? (
            <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Lock className="h-4 w-4 mr-2 text-amber-500" />
                  <p className="text-muted-foreground">This task is completed. The timeline is now archived.</p>
                </div>
                {!hasSubmittedReview && (
                  <Button variant="outline" className="mt-2" onClick={() => setShowReviewDialog(true)}>
                    Leave a Review
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="Type your message... (Press Enter for new line)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px] resize-none"
                rows={3}
              />
              <Button onClick={handleSendMessage} disabled={isSending || !message.trim()} className="self-end">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Reassign Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Reason for reassignment</Label>
            <Textarea
              id="reason"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              placeholder="Please provide a reason for reassigning this task..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassignTask}>Reassign Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this message? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMessageToDelete(null)
                setIsDeleteConfirmOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMessage}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      {task && task.assignment && (
        <ReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          taskId={task.id}
          taskTitle={task.title}
          reviewerId={user?.id || ""}
          reviewerName={user?.fullName || ""}
          reviewerType={user?.userType as "employer" | "student"}
          recipientId={user?.userType === "employer" ? task.assignment.studentId : task.ownerId || ""}
          recipientName={user?.userType === "employer" ? task.assignment.studentName : "Project Owner"}
          onReviewSubmitted={() => setHasSubmittedReview(true)}
        />
      )}
    </div>
  )
}
