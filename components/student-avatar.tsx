"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { findUserById } from "@/lib/storage"

interface StudentAvatarProps {
  studentId: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function StudentAvatar({ studentId, className, size = "md" }: StudentAvatarProps) {
  const router = useRouter()
  const student = findUserById(studentId)

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  // Get initials for fallback
  const getInitials = () => {
    if (!student?.fullName) return "S"

    const nameParts = student.fullName.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }
    return student.fullName.charAt(0).toUpperCase()
  }

  return (
    <Avatar
      className={`${sizeClasses[size]} cursor-pointer ${className || ""}`}
      onClick={() => router.push(`/profile/${studentId}`)}
    >
      <AvatarImage src={student?.profile?.avatar || ""} alt={student?.fullName || "Student"} />
      <AvatarFallback>{getInitials()}</AvatarFallback>
    </Avatar>
  )
}
