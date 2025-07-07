"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash, Eye, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { TASK_CATEGORIES } from "@/lib/constants"

// SOP storage key
const SOP_STORAGE_KEY = "kushl_standard_operating_procedures"

interface StandardOperatingProcedure {
  id: string
  category: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  createdBy: string
  creatorName: string
}

// Helper functions for SOP management
const getAllSOPs = (): StandardOperatingProcedure[] => {
  if (typeof window === "undefined") return []

  try {
    const sops = localStorage.getItem(SOP_STORAGE_KEY)
    return sops ? JSON.parse(sops) : []
  } catch (error) {
    console.error("Error getting SOPs:", error)
    return []
  }
}

const addSOP = (
  sop: Omit<StandardOperatingProcedure, "id" | "createdAt" | "updatedAt">,
): StandardOperatingProcedure => {
  const allSOPs = getAllSOPs()

  const newSOP: StandardOperatingProcedure = {
    ...sop,
    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  allSOPs.push(newSOP)
  localStorage.setItem(SOP_STORAGE_KEY, JSON.stringify(allSOPs))

  return newSOP
}

const updateSOP = (updatedSOP: StandardOperatingProcedure): boolean => {
  const allSOPs = getAllSOPs()
  const index = allSOPs.findIndex((sop) => sop.id === updatedSOP.id)

  if (index === -1) return false

  allSOPs[index] = {
    ...updatedSOP,
    updatedAt: Date.now(),
  }

  localStorage.setItem(SOP_STORAGE_KEY, JSON.stringify(allSOPs))
  return true
}

const deleteSOP = (sopId: string): boolean => {
  const allSOPs = getAllSOPs()
  const filteredSOPs = allSOPs.filter((sop) => sop.id !== sopId)

  if (filteredSOPs.length === allSOPs.length) return false

  localStorage.setItem(SOP_STORAGE_KEY, JSON.stringify(filteredSOPs))
  return true
}

export default function AdminSOPPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [sops, setSOPs] = useState<StandardOperatingProcedure[]>([])
  const [filteredSOPs, setFilteredSOPs] = useState<StandardOperatingProcedure[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSOPDialogOpen, setIsSOPDialogOpen] = useState(false)
  const [isViewSOPDialogOpen, setIsViewSOPDialogOpen] = useState(false)
  const [isDeleteSOPDialogOpen, setIsDeleteSOPDialogOpen] = useState(false)
  const [selectedSOP, setSelectedSOP] = useState<StandardOperatingProcedure | null>(null)
  const [sopForm, setSOPForm] = useState({
    category: "",
    title: "",
    content: "",
  })

  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "admin") {
      router.push("/")
      return
    }

    // Load SOPs
    loadSOPs()
  }, [user, router])

  const loadSOPs = () => {
    const allSOPs = getAllSOPs()
    setSOPs(allSOPs)
    setFilteredSOPs(allSOPs)
  }

  useEffect(() => {
    // Filter SOPs based on search query
    if (!searchQuery) {
      setFilteredSOPs(sops)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = sops.filter(
      (sop) =>
        sop.category.toLowerCase().includes(query) ||
        sop.title.toLowerCase().includes(query) ||
        sop.content.toLowerCase().includes(query),
    )
    setFilteredSOPs(filtered)
  }, [searchQuery, sops])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleAddSOP = () => {
    setSelectedSOP(null)
    setSOPForm({
      category: "",
      title: "",
      content: "",
    })
    setIsSOPDialogOpen(true)
  }

  const handleEditSOP = (sop: StandardOperatingProcedure) => {
    setSelectedSOP(sop)
    setSOPForm({
      category: sop.category,
      title: sop.title,
      content: sop.content,
    })
    setIsSOPDialogOpen(true)
  }

  const handleViewSOP = (sop: StandardOperatingProcedure) => {
    setSelectedSOP(sop)
    setIsViewSOPDialogOpen(true)
  }

  const handleDeleteSOP = (sop: StandardOperatingProcedure) => {
    setSelectedSOP(sop)
    setIsDeleteSOPDialogOpen(true)
  }

  const confirmDeleteSOP = () => {
    if (!selectedSOP) return

    const success = deleteSOP(selectedSOP.id)

    if (success) {
      toast({
        title: "SOP Deleted",
        description: `The SOP for ${selectedSOP.category} has been deleted.`,
      })

      loadSOPs()
    } else {
      toast({
        title: "Error",
        description: "Failed to delete SOP. Please try again.",
        variant: "destructive",
      })
    }

    setIsDeleteSOPDialogOpen(false)
  }

  const handleSOPSubmit = () => {
    if (!sopForm.category || !sopForm.title || !sopForm.content) {
      toast({
        title: "Missing Information",
        description: "Please provide a category, title, and content for the SOP.",
        variant: "destructive",
      })
      return
    }

    if (selectedSOP) {
      // Update existing SOP
      const updatedSOP: StandardOperatingProcedure = {
        ...selectedSOP,
        category: sopForm.category,
        title: sopForm.title,
        content: sopForm.content,
      }

      const success = updateSOP(updatedSOP)

      if (success) {
        toast({
          title: "SOP Updated",
          description: `The SOP for ${sopForm.category} has been updated.`,
        })

        loadSOPs()
      } else {
        toast({
          title: "Error",
          description: "Failed to update SOP. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      // Add new SOP
      if (!user) return

      const newSOP = addSOP({
        category: sopForm.category,
        title: sopForm.title,
        content: sopForm.content,
        createdBy: user.id,
        creatorName: user.fullName || user.email,
      })

      toast({
        title: "SOP Added",
        description: `A new SOP for ${sopForm.category} has been added.`,
      })

      loadSOPs()
    }

    setIsSOPDialogOpen(false)
  }

  if (!user || user.userType !== "admin") {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Standard Operating Procedures</h1>
        <Button onClick={() => router.push("/admin/dashboard")}>Back to Dashboard</Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search SOPs..." className="pl-8" value={searchQuery} onChange={handleSearch} />
        </div>
        <Button onClick={handleAddSOP}>
          <Plus className="h-4 w-4 mr-2" />
          Add SOP
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Standard Operating Procedures</CardTitle>
          <CardDescription>
            Manage SOPs that will be shown to students when they work on tasks in specific categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Content Preview</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSOPs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      {searchQuery ? "No SOPs found matching your search" : "No SOPs have been created yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSOPs.map((sop) => (
                    <TableRow key={sop.id}>
                      <TableCell className="font-medium">{sop.category}</TableCell>
                      <TableCell>{sop.title}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{sop.content.substring(0, 50)}...</div>
                      </TableCell>
                      <TableCell>{sop.creatorName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewSOP(sop)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditSOP(sop)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteSOP(sop)}>
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit SOP Dialog */}
      <Dialog open={isSOPDialogOpen} onOpenChange={setIsSOPDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedSOP ? "Edit SOP" : "Add SOP"}</DialogTitle>
            <DialogDescription>
              {selectedSOP
                ? "Edit the Standard Operating Procedure for this category."
                : "Create a new Standard Operating Procedure for a task category."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={sopForm.category} onValueChange={(value) => setSOPForm({ ...sopForm, category: value })}>
                <SelectTrigger id="category">
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={sopForm.title}
                onChange={(e) => setSOPForm({ ...sopForm, title: e.target.value })}
                placeholder="Enter a title for this SOP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">SOP Content</Label>
              <Textarea
                id="content"
                value={sopForm.content}
                onChange={(e) => setSOPForm({ ...sopForm, content: e.target.value })}
                placeholder="Enter the step-by-step procedure..."
                rows={10}
              />
              <p className="text-xs text-muted-foreground">
                Enter each step on a new line. Use clear, concise instructions.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSOPDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSOPSubmit}>{selectedSOP ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View SOP Dialog */}
      <Dialog open={isViewSOPDialogOpen} onOpenChange={setIsViewSOPDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedSOP?.title}</DialogTitle>
            <DialogDescription>Standard Operating Procedure for {selectedSOP?.category} tasks</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-md border p-4 bg-muted/50 whitespace-pre-line">{selectedSOP?.content}</div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewSOPDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete SOP Dialog */}
      <Dialog open={isDeleteSOPDialogOpen} onOpenChange={setIsDeleteSOPDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete SOP</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this Standard Operating Procedure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <div>
                <p className="font-medium">{selectedSOP?.title}</p>
                <p className="text-sm text-muted-foreground">{selectedSOP?.category}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteSOPDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSOP}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
