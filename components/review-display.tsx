import { Star } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Review } from "@/lib/task-management"

interface ReviewDisplayProps {
  review: Review
  className?: string
}

export function ReviewDisplay({ review, className }: ReviewDisplayProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{review.reviewerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{review.reviewerName}</span>
          </div>
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn("w-4 h-4", i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
              />
            ))}
          </div>
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(review.createdAt, { addSuffix: true })}
        </div>
      </CardHeader>
      <CardContent>
        {review.comment ? (
          <p className="text-sm">{review.comment}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No comment provided</p>
        )}
      </CardContent>
    </Card>
  )
}
