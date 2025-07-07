/* LOCKED_SECTION: timeline-page - DO NOT MODIFY
 * Description: Task timeline communication functionality
 * Last verified working: 2025-05-09
 * Dependencies: auth-context, task-management.ts
 * Checksum: 8e7d6c5b4a3f2e1d
 */
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getTaskById } from "@/lib/task-management"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessageSquare, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function TimelinePage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [task, setTask] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Load task data
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadTask = () => {
      console.log("Timeline - Loading task with ID:", id)
      const taskData = getTaskById(id as string)

      if (taskData) {
        console.log("Timeline - Task loaded successfully:", taskData)
        setTask(taskData)

        // Set debug info
        setDebugInfo({
          taskId: taskData.id,
          title: taskData.title,
          hasAssignment: !!taskData.assignment,
          assignmentStatus: taskData.assignment?.status,
          assigneeId: taskData.assigneeId,
          studentId: taskData.assignment?.studentId,
          studentName: taskData.assignment?.studentName,
          status: taskData.status,
          applications: taskData.applications?.length || 0,
        })
      } else {
        console.error("Timeline - Task not found with ID:", id)
        toast({
          title: "Task not found",
          description: "The requested task could not be found.",
          variant: "destructive",
        })
      }
      setIsLoading(false)
    }

    loadTask()
  }, [id, router, user, toast])

  const handleSendMessage = () => {
    if (!message.trim()) return

    setIsSending(true)

    // Simulate sending a message
    setTimeout(() => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      })
      setMessage("")
      setIsSending(false)
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Loading timeline...</h1>
        </div>
        <Card>
          <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-muted rounded-full mb-4"></div>
              <div className="h-4 w-48 bg-muted rounded mb-2"></div>
              <div className="h-4 w-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="container py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Task not found</h1>
        </div>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-2">Task not found</h2>
            <p className="text-muted-foreground mb-4">The task you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push("/explore")}>Back to Explore</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Timeline: {task.title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="min-h-[300px] flex flex-col justify-center items-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  This is where your conversation will appear. Start by sending a message below.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Textarea
              placeholder="Type your message here..."
              className="flex-1"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button className="self-end" onClick={handleSendMessage} disabled={isSending || !message.trim()}>
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>

        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Status</h3>
                  <Badge>{task.status}</Badge>
                </div>

                {task.assignment && (
                  <div>
                    <h3 className="font-medium mb-1">Assigned To</h3>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{task.assignment.studentName?.[0] || "S"}</AvatarFallback>
                      </Avatar>
                      <span>{task.assignment.studentName || "Student"}</span>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">{task.description || "No description provided."}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Task ID:</strong> {debugInfo?.taskId || "N/A"}
                </p>
                <p>
                  <strong>Has Assignment:</strong> {debugInfo?.hasAssignment ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Assignment Status:</strong> {debugInfo?.assignmentStatus || "None"}
                </p>
                <p>
                  <strong>Assignee ID:</strong> {debugInfo?.assigneeId || "None"}
                </p>
                <p>
                  <strong>Student ID:</strong> {debugInfo?.studentId || "None"}
                </p>
                <p>
                  <strong>Student Name:</strong> {debugInfo?.studentName || "None"}
                </p>
                <p>
                  <strong>Task Status:</strong> {debugInfo?.status || "Unknown"}
                </p>
                <p>
                  <strong>Applications:</strong> {debugInfo?.applications || 0}
                </p>
                <p>
                  <strong>Current URL:</strong> {typeof window !== "undefined" ? window.location.href : "N/A"}
                </p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/opportunity/${id}`)}
                >
                  Back to Opportunity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
/* END_LOCKED_SECTION: timeline-page */
