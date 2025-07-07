"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createSpecialTask } from "@/lib/task-management"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface CreateSpecialTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  taskType: "checklist_library" | "credentials_library" | "brand_brief" | "resource_library"
  projectId: string
  sprintId: string
  campaignId: string
}

export function CreateSpecialTaskDialog({
  isOpen,
  onClose,
  taskType,
  projectId,
  sprintId,
  campaignId,
}: CreateSpecialTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  const getTaskTypeName = () => {
    switch (taskType) {
      case "checklist_library":
        return "Checklist"
      case "credentials_library":
        return "Credentials"
      case "brand_brief":
        return "Brand Brief"
      case "resource_library":
        return "Resource"
      default:
        return "Item"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create tasks",
        variant: "destructive",
      })
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

    setIsSubmitting(true)

    try {
      const taskId = await createSpecialTask(
        projectId,
        sprintId,
        campaignId,
        taskType,
        title,
        description,
        user.id,
        user.fullName,
      )

      if (taskId) {
        toast({
          title: "Success",
          description: `${getTaskTypeName()} created successfully`,
        })

        // Redirect to the task page
        router.push(`/task/${taskId}`)
        onClose()
      } else {
        throw new Error("Failed to create task")
      }
    } catch (error) {
      console.error("Error creating special task:", error)
      toast({
        title: "Error",
        description: "There was an error creating the task",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create {getTaskTypeName()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Enter ${getTaskTypeName().toLowerCase()} title`}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Enter ${getTaskTypeName().toLowerCase()} description`}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
