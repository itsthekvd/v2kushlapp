"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { findUserById } from "@/lib/storage"

interface UserAvatarProps {
  userId: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  disableNavigation?: boolean
}

export function UserAvatar({ userId, className, size = "md", disableNavigation = false }: UserAvatarProps) {
  const router = useRouter()
  const user = findUserById(userId)

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  // Get initials for fallback
  const getInitials = () => {
    if (!user?.fullName) return "U"

    const nameParts = user.fullName.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }
    return user.fullName.charAt(0).toUpperCase()
  }

  // Get avatar image based on user type
  const getAvatarImage = () => {
    if (!user) return ""

    if (user.role === "employer") {
      return user.profile?.companyLogo || ""
    }

    return user.profile?.avatar || ""
  }

  const handleClick = () => {
    if (!disableNavigation) {
      router.push(`/profile/${userId}`)
    }
  }

  return (
    <Avatar
      className={`${sizeClasses[size]} ${!disableNavigation ? "cursor-pointer" : ""} ${className || ""}`}
      onClick={handleClick}
    >
      <AvatarImage src={getAvatarImage() || "/placeholder.svg"} alt={user?.fullName || "User"} />
      <AvatarFallback>{getInitials()}</AvatarFallback>
    </Avatar>
  )
}
