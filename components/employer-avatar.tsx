"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { findUserById } from "@/lib/storage"

interface EmployerAvatarProps {
  employerId: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  showLink?: boolean
}

export function EmployerAvatar({ employerId, className, size = "md", showLink = true }: EmployerAvatarProps) {
  const router = useRouter()
  const employer = findUserById(employerId)

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  // Get initials for fallback
  const getInitials = () => {
    if (!employer?.fullName) return "E"

    const nameParts = employer.fullName.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }
    return employer.fullName.charAt(0).toUpperCase()
  }

  const handleClick = () => {
    if (showLink && employer) {
      router.push(`/profile/${employerId}`)
    }
  }

  return (
    <Avatar
      className={`${sizeClasses[size]} ${showLink ? "cursor-pointer" : ""} ${className || ""}`}
      onClick={handleClick}
    >
      <AvatarImage
        src={employer?.profile?.companyLogo || employer?.profile?.avatar || ""}
        alt={employer?.fullName || "Employer"}
      />
      <AvatarFallback className="bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
    </Avatar>
  )
}
