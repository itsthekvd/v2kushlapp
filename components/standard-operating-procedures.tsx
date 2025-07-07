"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { TASK_CATEGORIES } from "@/lib/constants"
import { useAuth } from "@/contexts/auth-context"
import { Trash2, Plus, LinkIcon, FileText } from "lucide-react"

// Define the SOP type
interface StandardOperatingProcedure {
  id: string
  category: string
  title: string
  url: string
  createdAt: number
  updatedAt: number
}

// Local storage key
const SOP_STORAGE_KEY = "kushl_standard_operating_procedures"

export function StandardOperatingProcedures() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [sops, setSops] = useState<StandardOperatingProcedure[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newSop, setNewSop] = useState<Omit<StandardOperatingProcedure, "id" | "createdAt" | "updatedAt">>({
    category: TASK_CATEGORIES[0],
    title: "",
    url: "",
  })

  // Load SOPs from localStorage
  useEffect(() => {
    const storedSops = localStorage.getItem(SOP_STORAGE_KEY)
    if (storedSops) {
      try {
        const parsedSops = JSON.parse(storedSops)
        // Filter SOPs by user ID if needed
        const userSops =
          user?.userType === "employer"
            ? parsedSops.filter((sop: StandardOperatingProcedure) => sop.userId === user.id)
            : []
        setSops(userSops)
      } catch (error) {
        console.error("Error parsing SOPs:", error)
      }
    }
  }, [user])

  // Save SOPs to localStorage
  const saveSops = (updatedSops: StandardOperatingProcedure[]) => {
    // Get all SOPs first
    const storedSops = localStorage.getItem(SOP_STORAGE_KEY)
    let allSops: StandardOperatingProcedure[] = []

    if (storedSops) {
      try {
        const parsedSops = JSON.parse(storedSops)
        // Filter out the current user's SOPs
        allSops = parsedSops.filter((sop: StandardOperatingProcedure) => sop.userId !== user?.id)
      } catch (error) {
        console.error("Error parsing SOPs:", error)
      }
    }

    // Add the updated SOPs for the current user
    allSops = [...allSops, ...updatedSops]
    localStorage.setItem(SOP_STORAGE_KEY, JSON.stringify(allSops))
  }

  // Add a new SOP
  const handleAddSop = () => {
    if (!newSop.title.trim() || !newSop.url.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and URL for the SOP",
        variant: "destructive",
      })
      return
    }

    // Validate URL
    try {
      new URL(newSop.url)
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive",
      })
      return
    }

    const newSopItem: StandardOperatingProcedure = {
      id: Math.random().toString(36).substring(2, 15),
      ...newSop,
      userId: user?.id || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const updatedSops = [...sops, newSopItem]
    setSops(updatedSops)
    saveSops(updatedSops)

    // Reset form
    setNewSop({
      category: TASK_CATEGORIES[0],
      title: "",
      url: "",
    })
    setIsAddingNew(false)

    toast({
      title: "SOP added",
      description: "Your standard operating procedure has been added successfully",
    })
  }

  // Delete a SOP
  const handleDeleteSop = (id: string) => {
    const updatedSops = sops.filter((sop) => sop.id !== id)
    setSops(updatedSops)
    saveSops(updatedSops)

    toast({
      title: "SOP deleted",
      description: "The standard operating procedure has been deleted",
    })
  }

  // If not an employer, don't show this component
  if (user?.userType !== "employer") {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standard Operating Procedures</CardTitle>
        <CardDescription>Create and manage standard operating procedures for different task categories</CardDescription>
      </CardHeader>
      <CardContent>
        {sops.length > 0 ? (
          <div className="space-y-4">
            {sops.map((sop) => (
              <div key={sop.id} className="flex items-start justify-between rounded-md border p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{sop.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Category: {sop.category}</span>
                    <span>•</span>
                    <a
                      href={sop.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <LinkIcon className="h-3 w-3" />
                      View
                    </a>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteSop(sop.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium">No SOPs yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create standard operating procedures to help students complete tasks efficiently
            </p>
          </div>
        )}

        {isAddingNew ? (
          <div className="mt-6 space-y-4 rounded-md border p-4">
            <h3 className="font-medium">Add New SOP</h3>
            <div className="space-y-2">
              <Label htmlFor="sop-category">Category</Label>
              <Select value={newSop.category} onValueChange={(value) => setNewSop({ ...newSop, category: value })}>
                <SelectTrigger id="sop-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sop-title">Title</Label>
              <Input
                id="sop-title"
                value={newSop.title}
                onChange={(e) => setNewSop({ ...newSop, title: e.target.value })}
                placeholder="e.g., Website Development Guidelines"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sop-url">URL</Label>
              <Input
                id="sop-url"
                value={newSop.url}
                onChange={(e) => setNewSop({ ...newSop, url: e.target.value })}
                placeholder="https://docs.google.com/document/d/..."
              />
              <p className="text-xs text-muted-foreground">
                Enter a URL to a Google Doc, YouTube video, or any other resource
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSop}>Save SOP</Button>
            </div>
          </div>
        ) : (
          <Button className="mt-4 w-full" variant="outline" onClick={() => setIsAddingNew(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New SOP
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
