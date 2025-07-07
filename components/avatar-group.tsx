"use client"

import { UserAvatar } from "./user-avatar"
import { cn } from "@/lib/utils"

interface AvatarGroupProps {
  userIds: string[]
  max?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AvatarGroup({ userIds, max = 3, size = "md", className }: AvatarGroupProps) {
  const displayUserIds = userIds.slice(0, max)
  const remaining = userIds.length - max

  // Offset classes based on size
  const offsetClasses = {
    sm: "-ml-2",
    md: "-ml-3",
    lg: "-ml-4",
  }

  // Size classes for the "more" avatar
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }

  return (
    <div className={cn("flex", className)}>
      {displayUserIds.map((userId, index) => (
        <div
          key={userId}
          className={`${index > 0 ? offsetClasses[size] : ""} ring-2 ring-background rounded-full`}
          style={{ zIndex: 10 - index }}
        >
          <UserAvatar userId={userId} size={size} />
        </div>
      ))}

      {remaining > 0 && (
        <div
          className={`${offsetClasses[size]} flex items-center justify-center ${sizeClasses[size]} bg-muted text-muted-foreground font-medium rounded-full ring-2 ring-background`}
          style={{ zIndex: 10 - max }}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
