"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { addProject } from "@/lib/projects"
import { useAuth } from "@/contexts/auth-context"
import { generateId } from "@/lib/utils"

interface CreateProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (name: string, description: string) => void
}

interface Project {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
  ownerId: string
  sprints: []
}

export function CreateProjectDialog({ isOpen, onClose, onCreateProject }: CreateProjectDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const newProject: Project = {
        id: generateId(),
        name,
        description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ownerId: user?.id || "",
        sprints: [],
      }

      addProject(newProject)
      onCreateProject(name, description)

      // Redirect to the new project
      router.push(`/post/project/${newProject.id}`)

      setIsSubmitting(false)
      onClose()
    } catch (error) {
      console.error("Error creating project:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateProject} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
