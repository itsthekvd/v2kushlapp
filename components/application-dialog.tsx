"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

interface ApplicationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (note: string) => void
  initialNote?: string
  isEditing?: boolean
}

export function ApplicationDialog({
  isOpen,
  onClose,
  onSubmit,
  initialNote = "",
  isEditing = false,
}: ApplicationDialogProps) {
  const [note, setNote] = useState(initialNote)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = () => {
    if (!note.trim()) {
      toast({
        title: "Note required",
        description: "Please add a note to your application.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Submit the application
    try {
      onSubmit(note)
      setIsSubmitting(false)
      onClose()
    } catch (error) {
      console.error("Error submitting application:", error)
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Application" : "Apply for Task"}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Write a note to the employer explaining why you're a good fit for this task..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[150px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This note will be visible to the employer reviewing your application.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : isEditing ? "Update Application" : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
