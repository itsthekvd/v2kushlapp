"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { StandardOperatingProcedures } from "@/components/standard-operating-procedures"

export default function SOPPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect non-employers to homepage
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "employer") {
      router.push("/")
    }
  }, [user, router])

  if (!user || user.userType !== "employer") {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Standard Operating Procedures</h1>
      <p className="text-muted-foreground">
        Create and manage standard operating procedures for different task categories. These will be available to
        students when they work on your tasks.
      </p>

      <StandardOperatingProcedures />
    </div>
  )
}
