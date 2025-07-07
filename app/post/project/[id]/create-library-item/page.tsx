"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Link, Eye, EyeOff, Palette, Type, Users, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { createSpecialTask, TASK_CATEGORIES } from "@/lib/task-management"

type LibraryItemType = "checklist_library" | "credentials_library" | "brand_brief" | "resource_library"

export default function CreateLibraryItemPage() {
  const { id: projectId } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [itemType, setItemType] = useState<LibraryItemType>("checklist_library")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sprintId, setSprintId] = useState("")
  const [campaignId, setCampaignId] = useState("")
  const [sprints, setSprints] = useState<{ id: string; name: string }[]>([])
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])

  // Add this state for category
  const [category, setCategory] = useState<string>("")
  const [clientName, setClientName] = useState<string>("")

  // Checklist specific state
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; completed: boolean }[]>([
    { id: "1", text: "", completed: false },
  ])

  // Credentials specific state
  const [credentials, setCredentials] = useState<
    { id: string; service: string; username: string; password: string; notes: string; showPassword: boolean }[]
  >([{ id: "1", service: "", username: "", password: "", notes: "", showPassword: false }])

  // Brand brief specific state
  const [brandName, setBrandName] = useState("")
  const [brandColors, setBrandColors] = useState<string[]>(["#000000"])
  const [brandFonts, setBrandFonts] = useState<string[]>([""])
  const [brandVoice, setBrandVoice] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [keyMessages, setKeyMessages] = useState<string[]>([""])

  // Resource library specific state
  const [resources, setResources] = useState<
    { id: string; name: string; url: string; type: string; description: string }[]
  >([{ id: "1", name: "", url: "", type: "link", description: "" }])

  const loadProjectData = useCallback(async () => {
    try {
      // Import dynamically to avoid circular dependencies
      const { getProject } = await import("@/lib/task-management")
      const project = await getProject(projectId as string)

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
      } else {
        console.error("Project not found for ID:", projectId)
        router.push("/post")
      }
    } catch (error) {
      console.error("Error loading project data:", error)
    }
  }, [projectId, router])

  // Update the useEffect hook to ensure it properly sets the item type from URL parameter
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "employer") {
      router.push("/")
      return
    }

    // Get type from URL if available and set it immediately
    const typeParam = searchParams.get("type") as LibraryItemType | null
    console.log("URL type parameter:", typeParam)

    if (
      typeParam &&
      ["checklist_library", "credentials_library", "brand_brief", "resource_library"].includes(typeParam)
    ) {
      console.log("Setting item type to:", typeParam)
      // Force the itemType to update immediately
      setItemType(typeParam)

      // Set a timeout to ensure the itemType is updated after the component has rendered
      setTimeout(() => {
        console.log("Checking if itemType was updated:", itemType)
        if (itemType !== typeParam) {
          console.log("Forcing itemType update again")
          setItemType(typeParam)
        }
      }, 100)
    }

    // Load project data to get sprints and campaigns
    loadProjectData()
  }, [projectId, user, router, searchParams, loadProjectData, itemType])

  // Add a new useEffect that specifically handles the type parameter
  // This ensures the type is set even if the component re-renders
  useEffect(() => {
    const typeParam = searchParams.get("type") as LibraryItemType | null
    if (
      typeParam &&
      ["checklist_library", "credentials_library", "brand_brief", "resource_library"].includes(typeParam)
    ) {
      console.log("Setting item type from dedicated useEffect:", typeParam)
      setItemType(typeParam)
    }
  }, [searchParams, setItemType])

  // Update campaigns when sprint selection changes
  useEffect(() => {
    if (sprintId) {
      const loadCampaigns = async () => {
        try {
          const { getProject } = await import("@/lib/task-management")
          const project = await getProject(projectId as string)
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
  }, [sprintId, projectId])

  // Helper functions for form arrays
  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { id: Date.now().toString(), text: "", completed: false }])
  }

  const removeChecklistItem = (id: string) => {
    if (checklistItems.length > 1) {
      setChecklistItems(checklistItems.filter((item) => item.id !== id))
    }
  }

  const updateChecklistItem = (id: string, text: string) => {
    setChecklistItems(checklistItems.map((item) => (item.id === id ? { ...item, text } : item)))
  }

  const addCredential = () => {
    setCredentials([
      ...credentials,
      { id: Date.now().toString(), service: "", username: "", password: "", notes: "", showPassword: false },
    ])
  }

  const removeCredential = (id: string) => {
    if (credentials.length > 1) {
      setCredentials(credentials.filter((cred) => cred.id !== id))
    }
  }

  const updateCredential = (id: string, field: string, value: string) => {
    setCredentials(credentials.map((cred) => (cred.id === id ? { ...cred, [field]: value } : cred)))
  }

  const togglePasswordVisibility = (id: string) => {
    setCredentials(credentials.map((cred) => (cred.id === id ? { ...cred, showPassword: !cred.showPassword } : cred)))
  }

  const addBrandColor = () => {
    setBrandColors([...brandColors, "#000000"])
  }

  const removeBrandColor = (index: number) => {
    if (brandColors.length > 1) {
      setBrandColors(brandColors.filter((_, i) => i !== index))
    }
  }

  const updateBrandColor = (index: number, color: string) => {
    const newColors = [...brandColors]
    newColors[index] = color
    setBrandColors(newColors)
  }

  const addBrandFont = () => {
    setBrandFonts([...brandFonts, ""])
  }

  const removeBrandFont = (index: number) => {
    if (brandFonts.length > 1) {
      setBrandFonts(brandFonts.filter((_, i) => i !== index))
    }
  }

  const updateBrandFont = (index: number, font: string) => {
    const newFonts = [...brandFonts]
    newFonts[index] = font
    setBrandFonts(newFonts)
  }

  const addKeyMessage = () => {
    setKeyMessages([...keyMessages, ""])
  }

  const removeKeyMessage = (index: number) => {
    if (keyMessages.length > 1) {
      setKeyMessages(keyMessages.filter((_, i) => i !== index))
    }
  }

  const updateKeyMessage = (index: number, message: string) => {
    const newMessages = [...keyMessages]
    newMessages[index] = message
    setKeyMessages(newMessages)
  }

  const addResource = () => {
    setResources([...resources, { id: Date.now().toString(), name: "", url: "", type: "link", description: "" }])
  }

  const removeResource = (id: string) => {
    if (resources.length > 1) {
      setResources(resources.filter((res) => res.id !== id))
    }
  }

  const updateResource = (id: string, field: string, value: string) => {
    setResources(resources.map((res) => (res.id === id ? { ...res, [field]: value } : res)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create library items",
        variant: "destructive",
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the library item",
        variant: "destructive",
      })
      return
    }

    // Sprint and campaign are now optional

    // Validate based on item type
    if (itemType === "checklist_library") {
      const emptyItems = checklistItems.some((item) => !item.text.trim())
      if (emptyItems) {
        toast({
          title: "Empty checklist items",
          description: "Please fill in all checklist items or remove empty ones",
          variant: "destructive",
        })
        return
      }
    } else if (itemType === "credentials_library") {
      const incompleteCredentials = credentials.some(
        (cred) => !cred.service.trim() || !cred.username.trim() || !cred.password.trim(),
      )
      if (incompleteCredentials) {
        toast({
          title: "Incomplete credentials",
          description: "Please fill in all required credential fields (service, username, password)",
          variant: "destructive",
        })
        return
      }
    } else if (itemType === "brand_brief") {
      if (!brandName.trim()) {
        toast({
          title: "Brand name required",
          description: "Please enter a brand name",
          variant: "destructive",
        })
        return
      }
    } else if (itemType === "resource_library") {
      const incompleteResources = resources.some((res) => !res.name.trim() || !res.url.trim())
      if (incompleteResources) {
        toast({
          title: "Incomplete resources",
          description: "Please fill in all required resource fields (name, URL)",
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Prepare initial data based on item type
      let initialData: any = {}

      if (itemType === "checklist_library") {
        initialData = {
          items: checklistItems.map((item) => ({
            id: item.id,
            text: item.text,
            completed: item.completed,
          })),
          category: category, // Add category
        }
      } else if (itemType === "credentials_library") {
        initialData = {
          credentials: credentials.map((cred) => ({
            id: cred.id,
            service: cred.service,
            username: cred.username,
            password: cred.password,
            notes: cred.notes,
          })),
        }
      } else if (itemType === "brand_brief") {
        initialData = {
          brandName,
          clientName, // Add client name
          brandColors: brandColors.filter((color) => color.trim() !== ""),
          brandFonts: brandFonts.filter((font) => font.trim() !== ""),
          brandVoice,
          targetAudience,
          keyMessages: keyMessages.filter((msg) => msg.trim() !== ""),
        }
      } else if (itemType === "resource_library") {
        initialData = {
          resources: resources.map((res) => ({
            id: res.id,
            name: res.name,
            url: res.url,
            type: res.type,
            description: res.description,
          })),
          category: category, // Add category
        }
      }

      const taskId = await createSpecialTask(
        projectId as string,
        sprintId || "", // Make optional
        campaignId || "", // Make optional
        itemType,
        title,
        description,
        user.id,
        user.fullName || user.email,
        initialData,
      )

      if (taskId) {
        toast({
          title: "Success",
          description: `${getItemTypeName(itemType)} created successfully`,
        })

        // Redirect to the project page
        router.push(`/post/project/${projectId}?view=kanban`)
      } else {
        throw new Error(`Failed to create ${itemType}`)
      }
    } catch (error) {
      console.error(`Error creating ${itemType}:`, error)
      toast({
        title: "Error",
        description: `There was an error creating the ${getItemTypeName(itemType).toLowerCase()}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getItemTypeName = (type: LibraryItemType): string => {
    switch (type) {
      case "checklist_library":
        return "Checklist"
      case "credentials_library":
        return "Credentials"
      case "brand_brief":
        return "Brand Brief"
      case "resource_library":
        return "Resource Library"
      default:
        return "Library Item"
    }
  }

  // Update the page title to dynamically show the correct item type
  return (
    <div className="container py-6 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          Create {getItemTypeName((searchParams.get("type") as LibraryItemType) || itemType)}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="itemType">Item Type</Label>
            <Select
              value={itemType}
              onValueChange={(value) => {
                console.log("Dropdown selection changed to:", value)
                setItemType(value as LibraryItemType)
              }}
            >
              <SelectTrigger id="itemType">
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checklist_library">Checklist</SelectItem>
                <SelectItem value="credentials_library">Credentials</SelectItem>
                <SelectItem value="brand_brief">Brand Brief</SelectItem>
                <SelectItem value="resource_library">Resource Library</SelectItem>
              </SelectContent>
            </Select>

            {/* Add explanatory text based on selected type */}
            <div className="text-sm text-muted-foreground mt-1">
              {itemType === "checklist_library" &&
                "Create a reusable checklist of tasks or requirements that can be referenced in multiple tasks."}
              {itemType === "credentials_library" &&
                "Store login credentials securely for various platforms that students may need to access."}
              {itemType === "brand_brief" &&
                "Define brand guidelines including colors, fonts, and messaging for consistent branding across tasks."}
              {itemType === "resource_library" &&
                "Compile useful links, documents, and resources that can be attached to related tasks."}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Enter ${getItemTypeName(itemType).toLowerCase()} title`}
              required
            />
          </div>
        </div>

        {/* Add category field for checklist and resource library */}
        {(itemType === "checklist_library" || itemType === "resource_library") && (
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
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
        )}

        {/* Add client name field for brand brief */}
        {itemType === "brand_brief" && (
          <div className="space-y-2">
            <Label htmlFor="clientName">Client/Project Name</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client or project name"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Enter ${getItemTypeName(itemType).toLowerCase()} description`}
            rows={3}
          />
        </div>

        {/* Sprint and campaign selection removed as per requirements */}
        <div className="hidden">
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

        {/* Dynamic fields based on item type */}
        {itemType === "checklist_library" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Checklist Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            {checklistItems.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <Input
                  value={item.text}
                  onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                  placeholder={`Item ${index + 1}`}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeChecklistItem(item.id)}
                  disabled={checklistItems.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {itemType === "credentials_library" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Credentials</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCredential}>
                <Plus className="h-4 w-4 mr-1" /> Add Credential
              </Button>
            </div>

            {credentials.map((cred, index) => (
              <Card key={cred.id} className="p-4">
                <CardContent className="p-0 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Credential {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCredential(cred.id)}
                      disabled={credentials.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`service-${cred.id}`} className="text-xs">
                        Service/Platform URL
                      </Label>
                      <Input
                        id={`service-${cred.id}`}
                        value={cred.service}
                        onChange={(e) => updateCredential(cred.id, "service", e.target.value)}
                        placeholder="e.g., Google, Twitter, AWS"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`username-${cred.id}`} className="text-xs">
                        Username/Email
                      </Label>
                      <Input
                        id={`username-${cred.id}`}
                        value={cred.username}
                        onChange={(e) => updateCredential(cred.id, "username", e.target.value)}
                        placeholder="Username or email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`password-${cred.id}`} className="text-xs">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id={`password-${cred.id}`}
                        type={cred.showPassword ? "text" : "password"}
                        value={cred.password}
                        onChange={(e) => updateCredential(cred.id, "password", e.target.value)}
                        placeholder="Password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => togglePasswordVisibility(cred.id)}
                      >
                        {cred.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`notes-${cred.id}`} className="text-xs">
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id={`notes-${cred.id}`}
                      value={cred.notes}
                      onChange={(e) => updateCredential(cred.id, "notes", e.target.value)}
                      placeholder="Additional notes, access restrictions, etc."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {itemType === "brand_brief" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brandName" className="flex items-center gap-1">
                <Palette className="h-4 w-4" /> Brand Name
              </Label>
              <Input
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">
                  <Palette className="h-4 w-4" /> Brand Colors
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addBrandColor}>
                  <Plus className="h-4 w-4 mr-1" /> Add Color
                </Button>
              </div>

              {brandColors.map((color, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-md border" style={{ backgroundColor: color }} />
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => updateBrandColor(index, e.target.value)}
                    className="w-16 h-8 p-0"
                  />
                  <Input
                    value={color}
                    onChange={(e) => updateBrandColor(index, e.target.value)}
                    placeholder="Color hex code"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBrandColor(index)}
                    disabled={brandColors.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">
                  <Type className="h-4 w-4" /> Brand Fonts
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addBrandFont}>
                  <Plus className="h-4 w-4 mr-1" /> Add Font
                </Button>
              </div>

              {brandFonts.map((font, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={font}
                    onChange={(e) => updateBrandFont(index, e.target.value)}
                    placeholder="Font name (e.g., Arial, Roboto)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBrandFont(index)}
                    disabled={brandFonts.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandVoice" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" /> Brand Voice/Tone
              </Label>
              <Textarea
                id="brandVoice"
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                placeholder="Describe the brand's voice and tone (e.g., professional, friendly, authoritative)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience" className="flex items-center gap-1">
                <Users className="h-4 w-4" /> Target Audience
              </Label>
              <Textarea
                id="targetAudience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Describe the target audience for this brand"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> Key Messages
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addKeyMessage}>
                  <Plus className="h-4 w-4 mr-1" /> Add Message
                </Button>
              </div>

              {keyMessages.map((message, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={message}
                    onChange={(e) => updateKeyMessage(index, e.target.value)}
                    placeholder={`Key message ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeKeyMessage(index)}
                    disabled={keyMessages.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Define brand or project guidelines including colors, fonts, and messaging for consistent branding across
              tasks.
            </p>
          </div>
        )}

        {itemType === "resource_library" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Resources</Label>
              <Button type="button" variant="outline" size="sm" onClick={addResource}>
                <Plus className="h-4 w-4 mr-1" /> Add Resource
              </Button>
            </div>

            {resources.map((resource, index) => (
              <Card key={resource.id} className="p-4">
                <CardContent className="p-0 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Resource {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeResource(resource.id)}
                      disabled={resources.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`name-${resource.id}`} className="text-xs">
                      Resource Name
                    </Label>
                    <Input
                      id={`name-${resource.id}`}
                      value={resource.name}
                      onChange={(e) => updateResource(resource.id, "name", e.target.value)}
                      placeholder="Resource name"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`url-${resource.id}`} className="text-xs flex items-center gap-1">
                      <Link className="h-3 w-3" /> URL
                    </Label>
                    <Input
                      id={`url-${resource.id}`}
                      value={resource.url}
                      onChange={(e) => updateResource(resource.id, "url", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`type-${resource.id}`} className="text-xs">
                      Resource Type
                    </Label>
                    <Select value={resource.type} onValueChange={(value) => updateResource(resource.id, "type", value)}>
                      <SelectTrigger id={`type-${resource.id}`}>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="link">Link</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`description-${resource.id}`} className="text-xs">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id={`description-${resource.id}`}
                      value={resource.description}
                      onChange={(e) => updateResource(resource.id, "description", e.target.value)}
                      placeholder="Brief description of this resource"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="px-8">
            {isSubmitting ? "Creating..." : `Create ${getItemTypeName(itemType)}`}
          </Button>
        </div>
      </form>
    </div>
  )
}
