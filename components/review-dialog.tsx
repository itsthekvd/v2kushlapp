"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { submitTaskReview } from "@/lib/task-management"
import { useToast } from "@/components/ui/use-toast"

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  taskTitle: string
  reviewerId: string
  reviewerName: string
  reviewerType: "employer" | "student"
  recipientId: string
  recipientName: string
  onReviewSubmitted?: () => void
}

export function ReviewDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  reviewerId,
  reviewerName,
  reviewerType,
  recipientId,
  recipientName,
  onReviewSubmitted,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide a rating before submitting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const success = await submitTaskReview(
        taskId,
        reviewerId,
        reviewerName,
        reviewerType,
        recipientId,
        recipientName,
        rating,
        comment,
      )

      if (success) {
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!",
        })

        // Reset form
        setRating(0)
        setComment("")

        // Close dialog
        onOpenChange(false)

        // Call callback if provided
        if (onReviewSubmitted) {
          onReviewSubmitted()
        }
      } else {
        throw new Error("Failed to submit review")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: "There was an error submitting your review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {reviewerType === "employer"
              ? "Rate your experience with the student"
              : "Rate your experience with the employer"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label className="block mb-2">Task</Label>
            <p className="text-sm text-muted-foreground">{taskTitle}</p>
          </div>

          <div>
            <Label className="block mb-2">{reviewerType === "employer" ? "Student" : "Employer"}</Label>
            <p className="text-sm text-muted-foreground">{recipientName}</p>
          </div>

          <div>
            <Label htmlFor="rating" className="block mb-2">
              Rating
            </Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      (hoverRating || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium">
                {rating > 0 ? `${rating} star${rating !== 1 ? "s" : ""}` : "Select rating"}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="comment" className="block mb-2">
              Comments
            </Label>
            <Textarea
              id="comment"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Great reviews may be featured on our homepage to showcase success stories!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
