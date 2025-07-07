"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  getTaskById,
  updateTask,
  addCommentToTask,
  toggleTaskPublishStatus,
  toggleAutoPostToTimeline,
  getSprintAndCampaignNames,
  markTaskCompleted,
  updateApplicationStatus,
} from "@/lib/task-management"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Clock,
  CalendarIcon,
  Edit2,
  Save,
  X,
  MessageSquare,
  Globe,
  TimerIcon as Timeline,
  Banknote,
  Lock,
  Edit,
  Share2,
  Bookmark,
  Youtube,
  CheckSquare,
  Key,
  Palette,
  BookOpen,
  Link,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { findUserById } from "@/lib/storage"
import { YouTubeEmbed } from "@/components/youtube-embed"

export default function TaskDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [task, setTask] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState<any>({})
  const [newComment, setNewComment] = useState("")
  const [activeTab, setActiveTab] = useState("details")
  const [projectInfo, setProjectInfo] = useState<{ projectName?: string; sprintName?: string; projectId?: string }>({})
  const [isApplying, setIsApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [isSaved, setIsSaved] = useState(false) // Replace with actual saved state
  const [taskOwner, setTaskOwner] = useState<any>(null)

  // Redirect to /opportunity/[id]
  useEffect(() => {
    if (id) {
      router.replace(`/opportunity/${id}`)
    }
  }, [id, router])

  useEffect(() => {
    // Load task
    const loadTask = async () => {
      const taskData = getTaskById(id as string)
      if (taskData) {
        setTask(taskData)
        setEditValues({
          title: taskData.title,
          description: taskData.description || "",
          status: taskData.status,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          isPublished: taskData.isPublished,
          autoPostToTimeline: taskData.autoPostToTimeline !== false, // Default to true if undefined
          videoUrl: taskData.videoUrl || "",
          price: taskData.price || 0,
          category: taskData.category || "",
        })

        // Get project and sprint names
        const names = getSprintAndCampaignNames(taskData.id)
        setProjectInfo(names)

        // Get task owner info
        if (names.projectId) {
          const ownerData = findUserById(names.projectId)
          if (ownerData) {
            setTaskOwner(ownerData)
          }
        }
      } else {
        toast({
          title: "Task not found",
          description: "The task could not be found.",
          variant: "destructive",
        })
        router.push("/post")
      }
      setIsLoading(false)
    }

    loadTask()
  }, [id, router, toast])

  // Show registration nudge for non-logged-in users
  useEffect(() => {
    // Show registration nudge for non-logged-in users
    if (!user) {
      toast({
        title: "Want to apply for this task?",
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

  const handleSaveEdit = async () => {
    try {
      const success = await updateTask(task.id, editValues, user?.id || "", user?.fullName || "")

      if (success) {
        // Refresh task data
        const updatedTask = getTaskById(id as string)
        setTask(updatedTask)
        setIsEditing(false)

        toast({
          title: "Task updated",
          description: "Task details have been updated successfully",
        })
      } else {
        throw new Error("Failed to update task")
      }
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error updating task",
        description: "There was an error updating the task",
        variant: "destructive",
      })
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || task.status === "completed") return

    try {
      const success = await addCommentToTask(task.id, newComment.trim(), user?.id || "", user?.fullName || "")

      if (success) {
        // Refresh task data
        const updatedTask = getTaskById(id as string)
        setTask(updatedTask)
        setNewComment("")

        toast({
          title: "Comment added",
          description: "Your comment has been added successfully",
        })
      } else {
        throw new Error("Failed to add comment")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error adding comment",
        description: "There was an error adding your comment",
        variant: "destructive",
      })
    }
  }

  const handleTogglePublish = async () => {
    if (task.status === "completed") return

    try {
      const success = await toggleTaskPublishStatus(task.id, user?.id || "", user?.fullName || "")

      if (success) {
        // Refresh task data
        const updatedTask = getTaskById(id as string)
        setTask(updatedTask)
        setEditValues({
          ...editValues,
          isPublished: updatedTask?.isPublished,
        })

        toast({
          title: updatedTask?.isPublished ? "Task published" : "Task unpublished",
          description: updatedTask?.isPublished
            ? "Task is now visible in the marketplace"
            : "Task has been removed from the marketplace",
        })
      } else {
        throw new Error("Failed to toggle publish status")
      }
    } catch (error) {
      console.error("Error toggling publish status:", error)
      toast({
        title: "Error updating task",
        description: "There was an error updating the task publish status",
        variant: "destructive",
      })
    }
  }

  const handleToggleAutoPost = async () => {
    if (task.status === "completed") return

    try {
      const success = await toggleAutoPostToTimeline(task.id, user?.id || "", user?.fullName || "")

      if (success) {
        // Refresh task data
        const updatedTask = getTaskById(id as string)
        setTask(updatedTask)
        setEditValues({
          ...editValues,
          autoPostToTimeline: updatedTask?.autoPostToTimeline,
        })

        toast({
          title: "Setting updated",
          description: updatedTask?.autoPostToTimeline
            ? "Changes will be automatically posted to timeline"
            : "Changes will not be automatically posted to timeline",
        })
      } else {
        throw new Error("Failed to toggle auto-post setting")
      }
    } catch (error) {
      console.error("Error toggling auto-post setting:", error)
      toast({
        title: "Error updating setting",
        description: "There was an error updating the auto-post setting",
        variant: "destructive",
      })
    }
  }

  const getTimelineStatus = () => {
    if (!task.isPublished) {
      return {
        status: "inactive",
        message: "Publish this task to the marketplace to activate the timeline feature.",
      }
    }

    if (!task.assignment) {
      return {
        status: "pending",
        message: "Assign a student to this task to activate the timeline feature.",
      }
    }

    if (task.status === "completed") {
      return {
        status: "archived",
        message: "This task is completed. The timeline is now archived but still viewable.",
      }
    }

    return {
      status: "active",
      message: "Timeline is active. You can communicate with the assigned student here.",
    }
  }

  const handleMarkCompleted = async () => {
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
        <Button onClick={() => router.push("/post")}>Back to Projects</Button>
      </div>
    )
  }

  try {
    const formatEditHistory = (timestamp: number) => {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    }

    const timelineStatus = getTimelineStatus()
    const isTaskCompleted = task.status === "completed"
    const isTaskOwner = user?.id === projectInfo.projectId
    const isAssignedStudent = task.assignment && task.assignment.studentId === user?.id
    const isEmployer = user?.userType === "employer"
    const hasAssignedStudent = task.assignment && task.assignment.studentId
    const handleGoToTimeline = () => {
      router.push(`/task/${task.id}/timeline`)
    }

    const handleEditTask = () => {
      setIsEditing(true)
    }

    const handleApply = () => {
      setIsApplying(true)
      setTimeout(() => {
        setIsApplying(false)
        setHasApplied(true)
        toast({
          title: "Application submitted",
          description: "Your application has been submitted successfully",
        })
      }, 2000)
    }

    const handleSave = () => {
      setIsSaved(!isSaved)
      toast({
        title: isSaved ? "Task unsaved" : "Task saved",
        description: isSaved ? "Task removed from saved list" : "Task saved to your list",
      })
    }

    // Format price in Indian Rupees
    const formatIndianPrice = (price: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(price)
    }

    return (
      <div className="container py-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{isEditing ? "Edit Task" : task.title}</h1>
            {!isEditing && !isTaskCompleted && isTaskOwner && (
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {isTaskCompleted && (
              <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                <Lock className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {isEmployer ? (
              <>
                {/* Employer actions */}
                <Button className="flex-1 h-12" onClick={handleGoToTimeline} disabled={!hasAssignedStudent}>
                  {hasAssignedStudent ? "Go to Timeline" : "Timeline (Assign Student First)"}
                </Button>

                {isTaskOwner && (
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
            ) : (
              <>
                {/* Student actions */}
                {isAssignedStudent ? (
                  <Button className="flex-1 h-12" onClick={handleGoToTimeline}>
                    Go to Timeline
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
        </div>

        {/* Project and sprint info */}
        {(projectInfo.projectName || projectInfo.sprintName) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {projectInfo.projectName && (
              <Badge variant="outline" className="text-primary">
                Project: {projectInfo.projectName}
              </Badge>
            )}
            {projectInfo.sprintName && (
              <Badge variant="outline" className="text-blue-500">
                Sprint: {projectInfo.sprintName}
              </Badge>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="applications">
              Applications {task.applications?.length ? `(${task.applications.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editValues.title}
                        onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editValues.description}
                        onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={editValues.status}
                          onValueChange={(value) => setEditValues({ ...editValues, status: value })}
                        >
                          <SelectTrigger id="status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={editValues.priority}
                          onValueChange={(value) => setEditValues({ ...editValues, priority: value })}
                        >
                          <SelectTrigger id="priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="dueDate"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !editValues.dueDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editValues.dueDate ? format(new Date(editValues.dueDate), "PPP") : "Select due date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={editValues.dueDate ? new Date(editValues.dueDate) : undefined}
                            onSelect={(date) =>
                              setEditValues({ ...editValues, dueDate: date ? date.getTime() : undefined })
                            }
                            initialFocus
                          />
                          <div className="flex justify-center p-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditValues({ ...editValues, dueDate: undefined })}
                            >
                              Clear
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹ INR)</Label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="100"
                          value={editValues.price || ""}
                          onChange={(e) =>
                            setEditValues({ ...editValues, price: Number.parseFloat(e.target.value) || 0 })
                          }
                          placeholder="Enter price in INR"
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="videoUrl" className="flex items-center gap-2">
                        <Youtube className="h-4 w-4" /> YouTube Video URL (Optional)
                      </Label>
                      <Input
                        id="videoUrl"
                        value={editValues.videoUrl || ""}
                        onChange={(e) => setEditValues({ ...editValues, videoUrl: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isPublished"
                        checked={editValues.isPublished}
                        onCheckedChange={(checked) => setEditValues({ ...editValues, isPublished: checked })}
                      />
                      <Label htmlFor="isPublished">Publish to marketplace</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoPostToTimeline"
                        checked={editValues.autoPostToTimeline}
                        onCheckedChange={(checked) => setEditValues({ ...editValues, autoPostToTimeline: checked })}
                      />
                      <Label htmlFor="autoPostToTimeline">Auto-post to timeline</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold">{task.title}</h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge
                          className={
                            task.status === "completed"
                              ? "bg-green-500"
                              : task.status === "in_progress"
                                ? "bg-yellow-500"
                                : task.status === "review"
                                  ? "bg-purple-500"
                                  : task.status === "published"
                                    ? "bg-blue-500"
                                    : "bg-secondary"
                          }
                        >
                          {task.status.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            task.priority === "urgent"
                              ? "text-red-500 border-red-500"
                              : task.priority === "high"
                                ? "text-yellow-500 border-yellow-500"
                                : task.priority === "medium"
                                  ? "text-blue-500 border-blue-500"
                                  : "text-green-500 border-green-500"
                          }
                        >
                          {task.priority} priority
                        </Badge>
                        {task.dueDate && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                          </Badge>
                        )}
                        {task.category && (
                          <Badge variant="outline" className="text-gray-700">
                            {task.category}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {task.description && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                        <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                      </div>
                    )}

                    {task.checklistRef && (
                      <div className="mt-4 border rounded-md p-4">
                        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                          <CheckSquare className="h-4 w-4" /> Checklist: {task.checklistRef.title}
                        </h3>
                        <div className="space-y-2">
                          {task.checklistRef.items.map((item: any, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                id={`checklist-item-${index}`}
                                checked={item.completed}
                                className="mt-1"
                                readOnly
                              />
                              <label htmlFor={`checklist-item-${index}`} className="text-sm">
                                {item.text}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {task.credentialsRef && (
                      <div className="mt-4 border rounded-md p-4">
                        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                          <Key className="h-4 w-4" /> Credentials: {task.credentialsRef.title}
                        </h3>
                        <div className="space-y-3">
                          {task.credentialsRef.credentials.map((cred: any, index: number) => (
                            <div key={index} className="border-b pb-2 last:border-0 last:pb-0">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">{cred.service}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Username:</span> {cred.username}
                                </div>
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Password:</span> {cred.password}
                                </div>
                              </div>
                              {cred.notes && (
                                <div className="text-xs mt-1">
                                  <span className="text-muted-foreground">Notes:</span> {cred.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {task.brandBriefRef && task.brandBriefRef.brandBrief && (
                      <div className="mt-4 border rounded-md p-4">
                        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                          <Palette className="h-4 w-4" /> Brand Brief: {task.brandBriefRef.title}
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs text-muted-foreground">Brand Name:</span>
                            <p className="text-sm">{task.brandBriefRef.brandBrief.brandName}</p>
                          </div>

                          {task.brandBriefRef.brandBrief.brandColors &&
                            task.brandBriefRef.brandBrief.brandColors.length > 0 && (
                              <div>
                                <span className="text-xs text-muted-foreground">Brand Colors:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {task.brandBriefRef.brandBrief.brandColors.map((color: string, i: number) => (
                                    <div key={i} className="flex items-center gap-1">
                                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                                      <span className="text-xs">{color}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {task.brandBriefRef.brandBrief.brandFonts &&
                            task.brandBriefRef.brandBrief.brandFonts.length > 0 && (
                              <div>
                                <span className="text-xs text-muted-foreground">Brand Fonts:</span>
                                <p className="text-sm">{task.brandBriefRef.brandBrief.brandFonts.join(", ")}</p>
                              </div>
                            )}

                          {task.brandBriefRef.brandBrief.brandVoice && (
                            <div>
                              <span className="text-xs text-muted-foreground">Brand Voice:</span>
                              <p className="text-sm">{task.brandBriefRef.brandBrief.brandVoice}</p>
                            </div>
                          )}

                          {task.brandBriefRef.brandBrief.targetAudience && (
                            <div>
                              <span className="text-xs text-muted-foreground">Target Audience:</span>
                              <p className="text-sm">{task.brandBriefRef.brandBrief.targetAudience}</p>
                            </div>
                          )}

                          {task.brandBriefRef.brandBrief.keyMessages &&
                            task.brandBriefRef.brandBrief.keyMessages.length > 0 && (
                              <div>
                                <span className="text-xs text-muted-foreground">Key Messages:</span>
                                <ul className="list-disc list-inside text-sm mt-1">
                                  {task.brandBriefRef.brandBrief.keyMessages.map((msg: string, i: number) => (
                                    <li key={i}>{msg}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {task.resourcesRef && (
                      <div className="mt-4 border rounded-md p-4">
                        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                          <BookOpen className="h-4 w-4" /> Resources: {task.resourcesRef.title}
                        </h3>
                        <div className="space-y-3">
                          {task.resourcesRef.resources.map((res: any, index: number) => (
                            <div key={index} className="border-b pb-2 last:border-0 last:pb-0">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">{res.name}</span>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{res.type}</span>
                              </div>
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                              >
                                <Link className="h-3 w-3" /> {res.url}
                              </a>
                              {res.description && (
                                <p className="text-xs mt-1 text-muted-foreground">{res.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* YouTube Video */}
                    {task.videoUrl && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Video</h3>
                        <YouTubeEmbed url={task.videoUrl} className="rounded-md overflow-hidden" />
                      </div>
                    )}

                    <Separator />

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Marketplace Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{task.isPublished ? "Published" : "Not Published"}</span>
                          {!isTaskCompleted && isTaskOwner && (
                            <Button variant="outline" size="sm" onClick={handleTogglePublish}>
                              {task.isPublished ? "Unpublish" : "Publish"}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Pricing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{task.price ? formatIndianPrice(task.price) : "Not set"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Timeline className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Timeline Settings</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isTaskCompleted && isTaskOwner && (
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="autoPostToggle"
                                checked={task.autoPostToTimeline !== false}
                                onCheckedChange={handleToggleAutoPost}
                              />
                              <Label htmlFor="autoPostToggle" className="text-sm">
                                Auto-post to timeline
                              </Label>
                            </div>
                          )}
                          <Button variant="outline" size="sm" onClick={() => router.push(`/task/${task.id}/timeline`)}>
                            {isTaskCompleted ? "View Archive" : "Go to Timeline"}
                          </Button>
                        </div>
                      </div>

                      {/* Timeline Status Card */}
                      <Card className="mt-4">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mt-2",
                                timelineStatus.status === "active"
                                  ? "bg-green-500"
                                  : timelineStatus.status === "pending"
                                    ? "bg-yellow-500"
                                    : timelineStatus.status === "archived"
                                      ? "bg-amber-500"
                                      : "bg-gray-400",
                              )}
                            />
                            <div>
                              <h3 className="text-sm font-medium">
                                Timeline Status:{" "}
                                {timelineStatus.status === "active"
                                  ? "Active"
                                  : timelineStatus.status === "pending"
                                    ? "Pending"
                                    : timelineStatus.status === "archived"
                                      ? "Archived"
                                      : "Inactive"}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">{timelineStatus.message}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Comments Section - Now directly under details */}
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Comments</h3>
                      <div className="space-y-4">
                        {task.comments && Array.isArray(task.comments) && task.comments.length > 0 ? (
                          task.comments.map((comment: any) => (
                            <div key={comment.id || Math.random()} className="flex gap-3 pb-4 border-b last:border-0">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{(comment.userName || "?").charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{comment.userName || "Anonymous"}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {comment.createdAt
                                      ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                                      : ""}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{comment.text || ""}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No comments yet</p>
                          </div>
                        )}
                      </div>
                      {!isTaskCompleted ? (
                        <div className="flex w-full gap-2 mt-4">
                          <Textarea
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                            Post
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full text-muted-foreground mt-4">
                          <Lock className="h-4 w-4 mr-2" />
                          <span>Comments are locked as this task is completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Applications</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {task.applications && Array.isArray(task.applications) && task.applications.length > 0 ? (
                  <div className="space-y-4">
                    {task.applications.map((application: any) => (
                      <div key={application.id || Math.random()} className="border rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{application.studentName || "Unnamed Student"}</h3>
                            <p className="text-sm text-muted-foreground">
                              {application.studentEmail || "No email provided"}
                            </p>
                          </div>
                          <Badge
                            className={
                              application.status === "approved"
                                ? "bg-green-500"
                                : application.status === "rejected"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                            }
                          >
                            {application.status || "pending"}
                          </Badge>
                        </div>
                        {application.note && (
                          <div className="mt-2">
                            <h4 className="text-sm font-medium">Cover Note:</h4>
                            <p className="text-sm mt-1">{application.note}</p>
                          </div>
                        )}
                        <div className="mt-4 flex justify-end gap-2">
                          {application.status === "pending" && isTaskOwner && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 border-red-500 hover:bg-red-50"
                                onClick={() =>
                                  updateApplicationStatus(
                                    task.id,
                                    application.id,
                                    "rejected",
                                    user?.id || "",
                                    user?.fullName || "",
                                  )
                                }
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() =>
                                  updateApplicationStatus(
                                    task.id,
                                    application.id,
                                    "approved",
                                    user?.id || "",
                                    user?.fullName || "",
                                  )
                                }
                              >
                                Approve
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/profile/${application.studentId || ""}`)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No applications yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Registration nudge for non-logged-in users */}
        {!user && (
          <div className="flex items-center gap-2 rounded-lg border border-primary p-4 mt-4 bg-primary/5">
            <div className="flex-1">
              <h3 className="font-medium">Want to apply for this task?</h3>
              <p className="text-sm text-muted-foreground">Register as a student to apply for this opportunity</p>
            </div>
            <Button onClick={() => router.push("/register/student")}>Register Now</Button>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error rendering task page:", error)
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Error loading task</h1>
        <p className="text-red-500">There was an error loading this task. Please try again later.</p>
        <Button onClick={() => router.push("/post")} className="mt-4">
          Back to Projects
        </Button>
      </div>
    )
  }
}
