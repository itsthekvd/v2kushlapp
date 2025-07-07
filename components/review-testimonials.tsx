"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { getBestReviews, type ReviewWithTaskInfo } from "@/lib/reviews"

interface ReviewTestimonialsProps {
  reviewerType: "employer" | "student"
  title: string
  description: string
}

export function ReviewTestimonials({ reviewerType, title, description }: ReviewTestimonialsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const { reviews, totalPages } = getBestReviews(reviewerType, 3, currentPage)

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>

      {reviews.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No reviews yet. Be the first to leave a review!</p>
        </div>
      )}
    </div>
  )
}

interface ReviewCardProps {
  review: ReviewWithTaskInfo
}

function ReviewCard({ review }: ReviewCardProps) {
  // Generate initials from name
  const initials = review.reviewerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // Generate avatar URL based on name (for consistency)
  const avatarUrl = `/placeholder.svg?height=40&width=40&query=${encodeURIComponent(review.reviewerName)}`

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex-1 pt-6">
        <div className="mb-2 flex items-center justify-between">
          <Quote className="h-5 w-5 text-muted-foreground opacity-50" />
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground opacity-25"
                }`}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{review.comment}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Task: <span className="font-medium">{review.taskTitle}</span>
        </p>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={review.reviewerName} />
            <AvatarFallback
              className={
                review.reviewerType === "student" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
              }
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{review.reviewerName}</p>
            <p className="text-xs text-muted-foreground">
              {review.reviewerType === "student" ? "Student" : "Employer"}
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
