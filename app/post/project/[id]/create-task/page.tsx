"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ArrowLeft, Youtube, CheckSquare, Key, Palette, BookOpen, Lock } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import {
  TASK_CATEGORIES,
  isValidYouTubeUrl,
  getTasksByType,
  generateId,
  addTaskToCampaign,
} from "@/lib/task-management"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CreateTaskPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUserData, isLoading } = useAuth()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [status, setStatus] = useState("to_do")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly">("daily")
  const [price, setPrice] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [youtubeError, setYoutubeError] = useState<string | null>(null)

  // Library references
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>("")
  const [selectedCredentialsId, setSelectedCredentialsId] = useState<string>("")
  const [selectedBrandBriefId, setSelectedBrandBriefId] = useState<string>("")
  const [selectedResourcesId, setSelectedResourcesId] = useState<string>("")

  // Add these state variables at the top of the component:
  const [selectedChecklists, setSelectedChecklists] = useState<string[]>([])
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([])
  const [selectedResources, setSelectedResources] = useState<string[]>([])

  // Available library items
  const [availableChecklists, setAvailableChecklists] = useState<any[]>([])
  const [availableCredentials, setAvailableCredentials] = useState<any[]>([])
  const [availableBrandBriefs, setAvailableBrandBriefs] = useState<any[]>([])
  const [availableResources, setAvailableResources] = useState<any[]>([])

  const [sprintId, setSprintId] = useState("")
  const [campaignId, setCampaignId] = useState("")
  const [sprints, setSprints] = useState<{ id: string; name: string }[]>([])
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])

  const [hasCheckedUser, setHasCheckedUser] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      // Check if user is logged in
      if (!user) {
        router.push(`/login?redirect=/post/project/${id}/create-task`)
        return
      }

      // Check if user is an employer
      if (user.userType !== "employer") {
        router.push("/")
        return
      }
    }
  }, [user, isLoading, router, id])

  // State to track if the initial useEffect has run
  const [initialEffectRan, setInitialEffectRan] = useState(false)

  useEffect(() => {
    // This effect should only run once after the component mounts
    if (!initialEffectRan) {
      setInitialEffectRan(true)

      // Only refresh user data on initial mount
      const currentUser = user || refreshUserData()

      if (!currentUser) {
        // If no user after refresh, redirect to login
        toast({
          title: "Session expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (currentUser.userType !== "employer") {
        toast({
          title: "Access denied",
          description: "Only employers can create tasks.",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      // Handle null or invalid project ID
      if (!id || id === "null") {
        console.log("No valid project ID provided, checking for default project")
        const defaultProjectId = localStorage.getItem(`kushl_default_project_${currentUser.id}`)

        if (defaultProjectId) {
          console.log("Redirecting to default project:", defaultProjectId)
          router.replace(`/post/project/${defaultProjectId}/create-task`)
        } else {
          console.log("No default project found, creating one")
          // Import dynamically to avoid circular dependencies
          import("@/lib/default-project").then(({ createDefaultProjectForUser }) => {
            createDefaultProjectForUser(currentUser.id, currentUser.fullName || currentUser.email).then(
              (newProjectId) => {
                console.log("Created default project:", newProjectId)
                router.replace(`/post/project/${newProjectId}/create-task`)
              },
            )
          })
        }
        return
      }

      // Load project data to get sprints and campaigns
      const loadProjectData = async () => {
        try {
          // Import dynamically to avoid circular dependencies
          const { getProject } = await import("@/lib/task-management")
          const project = getProject(id as string)

          if (project) {
            // Extract sprints
            const projectSprints = project.sprints.map((sprint) => ({
              id: sprint.id,
              name: sprint.name,
            }))
            setSprints(projectSprints)

            // If there's only one sprint, select it by default
            if (projectSprints.length === 1) {
              setSprintId(projectSprints[0].id)

              // Extract campaigns for this sprint
              const sprintCampaigns = project.sprints[0].campaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.name,
              }))
              setCampaigns(sprintCampaigns)

              // If there's only one campaign, select it by default
              if (sprintCampaigns.length === 1) {
                setCampaignId(sprintCampaigns[0].id)
              }
            }

            // Load library items
            loadLibraryItems(id as string)
          } else {
            console.error("Project not found for ID:", id)

            // Instead of redirecting, try to use the default project
            const defaultProjectId = localStorage.getItem(`kushl_default_project_${currentUser.id}`)
            if (defaultProjectId) {
              router.replace(`/post/project/${defaultProjectId}/create-task`)
            } else {
              router.push("/post")
            }
          }
        } catch (error) {
          console.error("Error loading project data:", error)
        }
      }

      loadProjectData()

      // Get recurring param from URL if available
      const recurringParam = searchParams.get("recurring")
      if (recurringParam) {
        setIsRecurring(true)
        setRecurrenceType(recurringParam as "daily" | "weekly" | "monthly")
      }
    }
  }, [id, router, searchParams, toast, user, refreshUserData, initialEffectRan])

  // useEffect(() => {
  //   if (!isLoading) {
  //     // Check if user is logged in
  //     if (!user) {
  //       router.push(`/login?redirect=/post/project/${id}/create-task`)
  //       return
  //     }

  //     // Check if user is an employer
  //     if (user.userType !== "employer") {
  //       router.push("/")
  //       return
  //     }
  //   }
  // }, [user, isLoading, router, id]);

  if (isLoading) {
    return (
      <div className="container py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full max-w-md mb-6" />
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-10 w-full mb-6" />
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-4" />
              ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // If not authenticated or not an employer, show locked message
  if (!user || user.userType !== "employer") {
    return (
      <div className="container py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Create Task</h1>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Lock className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-bold text-amber-800 mb-2">Task Creation Locked</h2>
            <p className="text-amber-700 mb-4">
              {!user ? "You need to be logged in to create tasks." : "Only employers can create tasks."}
            </p>
            <Button
              onClick={() =>
                !user ? router.push(`/login?redirect=/post/project/${id}/create-task`) : router.push("/")
              }
            >
              {!user ? "Login to Access" : "Go to Home"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Load library items for the project
  const loadLibraryItems = async (projectId: string) => {
    try {
      // Get checklists
      const checklists = await getTasksByType(projectId, "checklist_library")
      setAvailableChecklists(checklists)

      // Get credentials
      const credentials = await getTasksByType(projectId, "credentials_library")
      setAvailableCredentials(credentials)

      // Get brand briefs
      const brandBriefs = await getTasksByType(projectId, "brand_brief")
      setAvailableBrandBriefs(brandBriefs)

      // Get resources
      const resources = await getTasksByType(projectId, "resource_library")
      setAvailableResources(resources)
    } catch (error) {
      console.error("Error loading library items:", error)
    }
  }

  // Update campaigns when sprint selection changes
  useEffect(() => {
    if (sprintId) {
      const loadCampaigns = async () => {
        try {
          const { getProject } = await import("@/lib/task-management")
          const project = getProject(id as string)
          if (project) {
            const sprint = project.sprints.find((s) => s.id === sprintId)
            if (sprint) {
              const sprintCampaigns = sprint.campaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.name,
              }))
              setCampaigns(sprintCampaigns)

              // If there's only one campaign, select it by default
              if (sprintCampaigns.length === 1) {
                setCampaignId(sprintCampaigns[0].id)
              } else {
                // Clear the selected campaign if there are multiple
                setCampaignId("")
              }
            }
          }
        } catch (error) {
          console.error("Error loading campaigns:", error)
        }
      }

      loadCampaigns()
    } else {
      setCampaigns([])
      setCampaignId("")
    }
  }, [sprintId, id])

  // Validate YouTube URL when it changes
  useEffect(() => {
    if (videoUrl && !isValidYouTubeUrl(videoUrl)) {
      setYoutubeError("Please enter a valid YouTube URL")
    } else {
      setYoutubeError(null)
    }
  }, [videoUrl])

  // Add these toggle functions:
  const toggleChecklistSelection = (checklistId: string) => {
    setSelectedChecklists((prev) =>
      prev.includes(checklistId) ? prev.filter((id) => id !== checklistId) : [...prev, checklistId],
    )
  }

  const toggleCredentialSelection = (credentialId: string) => {
    setSelectedCredentials((prev) =>
      prev.includes(credentialId) ? prev.filter((id) => id !== credentialId) : [...prev, credentialId],
    )
  }

  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResources((prev) =>
      prev.includes(resourceId) ? prev.filter((id) => id !== resourceId) : [...prev, resourceId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent multiple submissions
    if (isSubmitting) {
      return
    }

    // Refresh user data to ensure we have the latest session
    const currentUser = refreshUserData()

    if (!currentUser) {
      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the task",
        variant: "destructive",
      })
      return
    }

    if (!sprintId || !campaignId) {
      toast({
        title: "Sprint and campaign required",
        description: "Please select a sprint and campaign for the task",
        variant: "destructive",
      })
      return
    }

    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a category for the task",
        variant: "destructive",
      })
      return
    }

    if (videoUrl && !isValidYouTubeUrl(videoUrl)) {
      toast({
        title: "Invalid YouTube URL",
        description: "Please enter a valid YouTube URL or leave it blank",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    console.log("Form submitted, creating task...")

    try {
      // Create task ID
      const taskId = generateId()
      console.log("Generated task ID:", taskId)

      const now = Date.now()

      // Determine the appropriate status based on recurrence
      let finalStatus = status
      if (isRecurring) {
        finalStatus = `recurring_${recurrenceType}` as any
      }

      // Parse price to number, default to 0 if invalid
      const priceValue = Number.parseFloat(price) || 0

      // Prepare library references
      const libraryReferences: any = {}

      if (selectedChecklists.length > 0) {
        libraryReferences.checklistRefs = selectedChecklists
          .map((id) => {
            const checklist = availableChecklists.find((c) => c.id === id)
            if (checklist) {
              return {
                id: checklist.id,
                title: checklist.title,
                items: checklist.checklistItems || [],
              }
            }
            return null
          })
          .filter(Boolean)
      }

      if (selectedCredentials.length > 0) {
        libraryReferences.credentialRefs = selectedCredentials
          .map((id) => {
            const credential = availableCredentials.find((c) => c.id === id)
            if (credential) {
              return {
                id: credential.id,
                title: credential.title,
                credentials: credential.credentials || [],
              }
            }
            return null
          })
          .filter(Boolean)
      }

      if (selectedBrandBriefId) {
        const brandBrief = availableBrandBriefs.find((b) => b.id === selectedBrandBriefId)
        if (brandBrief) {
          libraryReferences.brandBriefRef = {
            id: brandBrief.id,
            title: brandBrief.title,
            brandBrief: brandBrief.brandBrief || {},
          }
        }
      }

      if (selectedResources.length > 0) {
        libraryReferences.resourceRefs = selectedResources
          .map((id) => {
            const resource = availableResources.find((r) => r.id === id)
            if (resource) {
              return {
                id: resource.id,
                title: resource.title,
                resources: resource.resources || [],
              }
            }
            return null
          })
          .filter(Boolean)
      }

      // Create task object
      const task = {
        id: taskId,
        title,
        description,
        status: finalStatus,
        priority: priority,
        campaignId,
        createdAt: now,
        updatedAt: now,
        dueDate: dueDate ? dueDate.getTime() : undefined,
        isPublished: true, // Always publish to marketplace
        publishedAt: now,
        videoUrl: videoUrl || undefined,
        price: priceValue,
        category: category || undefined,
        recurrenceType: isRecurring ? recurrenceType : undefined,
        isRecurringCompleted: false,
        ...libraryReferences, // Add library references
        editHistory: [
          {
            userId: currentUser.id,
            userName: currentUser.fullName || currentUser.email,
            timestamp: now,
            action: "Created task",
          },
        ],
      }

      console.log("Task object created:", task)

      // Add task to campaign
      const success = await addTaskToCampaign(
        id as string,
        sprintId,
        campaignId,
        task,
        currentUser.id,
        currentUser.fullName || currentUser.email,
      )

      console.log("Task added to campaign:", success)

      if (success) {
        // Store the task ID in localStorage for highlighting
        localStorage.setItem("highlight_task_id", taskId)
        console.log("Task ID stored in localStorage")

        // Show success toast
        toast({
          title: "Task created",
          description: "Your task has been created successfully",
        })

        // Redirect to the task page directly
        router.push(`/task/${taskId}`)
      } else {
        throw new Error("Failed to add task to campaign")
      }
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: "There was an error creating the task",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-6 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/post/project/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Create New Task</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
        <div className="space-y-2">
          <Label htmlFor="title">Task Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sprint">Sprint</Label>
            <Select value={sprintId} onValueChange={setSprintId}>
              <SelectTrigger id="sprint">
                <SelectValue placeholder="Select a sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign</Label>
            <Select value={campaignId} onValueChange={setCampaignId} disabled={!sprintId || campaigns.length === 0}>
              <SelectTrigger id="campaign">
                <SelectValue placeholder={!sprintId ? "Select a sprint first" : "Select a campaign"} />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory} required>
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
            <Label htmlFor="price">Price (₹ INR)</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
              <Input
                id="price"
                type="number"
                min="0"
                step="100"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price in INR"
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dueDate"
                  type="button"
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" side="bottom" align="center" sideOffset={4}>
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="rounded-md border max-w-full overflow-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" /> YouTube Video URL (Optional)
            </Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={youtubeError ? "border-red-500" : ""}
            />
            {youtubeError && <p className="text-sm text-red-500">{youtubeError}</p>}
          </div>
        </div>

        {/* Library References Section */}
        <div className="space-y-4 border p-4 rounded-md bg-gray-50">
          <h3 className="font-medium">Attach Library Items</h3>
          <p className="text-sm text-muted-foreground">
            Attach items from your libraries to provide additional information to the student.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Checklist Reference - Modified to allow multiple selections */}
            <div className="space-y-2">
              <Label htmlFor="checklistRef" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" /> Checklists
              </Label>
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                {availableChecklists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No checklists available</p>
                ) : (
                  availableChecklists.map((checklist) => (
                    <div key={checklist.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        id={`checklist-${checklist.id}`}
                        checked={selectedChecklists.includes(checklist.id)}
                        onChange={() => toggleChecklistSelection(checklist.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`checklist-${checklist.id}`} className="text-sm">
                        {checklist.title}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {selectedChecklists.length > 0 && (
                <div className="text-xs text-muted-foreground">{selectedChecklists.length} checklist(s) selected</div>
              )}
              {availableChecklists.length === 0 && (
                <Button
                  type="button"
                  variant="link"
                  className="text-xs p-0 h-auto"
                  onClick={() => router.push(`/post/project/${id}/create-library-item?type=checklist_library`)}
                >
                  Create a new checklist
                </Button>
              )}
            </div>

            {/* Credentials Reference - Modified to allow multiple selections */}
            <div className="space-y-2">
              <Label htmlFor="credentialsRef" className="flex items-center gap-2">
                <Key className="h-4 w-4" /> Credentials
              </Label>
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                {availableCredentials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No credentials available</p>
                ) : (
                  availableCredentials.map((credential) => (
                    <div key={credential.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        id={`credential-${credential.id}`}
                        checked={selectedCredentials.includes(credential.id)}
                        onChange={() => toggleCredentialSelection(credential.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`credential-${credential.id}`} className="text-sm">
                        {credential.title}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {selectedCredentials.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {selectedCredentials.length} credential set(s) selected
                </div>
              )}
              {availableCredentials.length === 0 && (
                <Button
                  type="button"
                  variant="link"
                  className="text-xs p-0 h-auto"
                  onClick={() => router.push(`/post/project/${id}/create-library-item?type=credentials_library`)}
                >
                  Create new credentials
                </Button>
              )}
            </div>

            {/* Brand Brief Reference */}
            <div className="space-y-2">
              <Label htmlFor="brandBriefRef" className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Brand Brief
              </Label>
              <Select
                value={selectedBrandBriefId}
                onValueChange={setSelectedBrandBriefId}
                disabled={availableBrandBriefs.length === 0}
              >
                <SelectTrigger id="brandBriefRef">
                  <SelectValue
                    placeholder={
                      availableBrandBriefs.length === 0 ? "No brand briefs available" : "Select a brand brief"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableBrandBriefs.map((brief) => (
                    <SelectItem key={brief.id} value={brief.id}>
                      {brief.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableBrandBriefs.length === 0 && (
                <Button
                  type="button"
                  variant="link"
                  className="text-xs p-0 h-auto"
                  onClick={() => router.push(`/post/project/${id}/create-library-item?type=brand_brief`)}
                >
                  Create a new brand brief
                </Button>
              )}
            </div>

            {/* Resources Reference - Modified to allow multiple selections */}
            <div className="space-y-2">
              <Label htmlFor="resourcesRef" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Resources
              </Label>
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                {availableResources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No resources available</p>
                ) : (
                  availableResources.map((resource) => (
                    <div key={resource.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        id={`resource-${resource.id}`}
                        checked={selectedResources.includes(resource.id)}
                        onChange={() => toggleResourceSelection(resource.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`resource-${resource.id}`} className="text-sm">
                        {resource.title}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {selectedResources.length > 0 && (
                <div className="text-xs text-muted-foreground">{selectedResources.length} resource(s) selected</div>
              )}
              {availableResources.length === 0 && (
                <Button
                  type="button"
                  variant="link"
                  className="text-xs p-0 h-auto"
                  onClick={() => router.push(`/post/project/${id}/create-library-item?type=resource_library`)}
                >
                  Create new resources
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 border p-4 rounded-md bg-gray-50">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isRecurring" className="font-medium">
              This is a recurring task
            </Label>
          </div>

          {isRecurring && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="recurrenceType">Recurrence Type</Label>
              <Select value={recurrenceType} onValueChange={(value) => setRecurrenceType(value as any)}>
                <SelectTrigger id="recurrenceType">
                  <SelectValue placeholder="Select recurrence type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => router.push(`/post/project/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="px-8">
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </div>
  )
}
