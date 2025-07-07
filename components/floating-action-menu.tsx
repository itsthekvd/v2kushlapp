"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, CheckSquare, Key, Palette, BookOpen } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"

export function FloatingActionMenu() {
  const { id: projectId } = useParams()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const session = useSession()
  // Safely access user data with optional chaining
  const user = session?.data?.user || null

  // Update the handleCreateTask function to check for a valid project ID
  const handleCreateTask = () => {
    if (!projectId || projectId === "null") {
      // If no valid project ID, check for default project
      // Only try to access localStorage if we have a user ID
      const defaultProjectId = user?.id ? localStorage.getItem(`kushl_default_project_${user.id}`) : null

      if (defaultProjectId) {
        router.push(`/post/project/${defaultProjectId}/create-task`)
      } else {
        // No default project, redirect to projects page
        router.push("/post")
        toast({
          title: "No project selected",
          description: "Please select or create a project first",
        })
      }
    } else {
      router.push(`/post/project/${projectId}/create-task`)
    }
  }

  const handleCreateRecurringTask = (type: "daily" | "weekly" | "monthly") => {
    router.push(`/post/project/${projectId}/create-task?recurring=${type}`)
  }

  // Update the handleCreateLibraryItem function to ensure the type parameter is correctly passed
  const handleCreateLibraryItem = (type: string) => {
    if (!projectId || projectId === "null") {
      // If no valid project ID, check for default project
      const defaultProjectId = user?.id ? localStorage.getItem(`kushl_default_project_${user.id}`) : null

      if (defaultProjectId) {
        // Add console log to verify the URL being constructed
        console.log(`Redirecting to: /post/project/${defaultProjectId}/create-library-item?type=${type}`)
        router.push(`/post/project/${defaultProjectId}/create-library-item?type=${type}`)
      } else {
        // No default project, redirect to projects page
        router.push("/post")
        toast({
          title: "No project selected",
          description: "Please select or create a project first",
        })
      }
    } else {
      // Add console log to verify the URL being constructed
      console.log(`Creating library item of type: ${type} for project: ${projectId}`)
      console.log(`Redirecting to: /post/project/${projectId}/create-library-item?type=${type}`)
      router.push(`/post/project/${projectId}/create-library-item?type=${type}`)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="h-14 w-14 rounded-full shadow-lg" size="icon">
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        {/* Update the DropdownMenuContent to use the correct type values */}
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Create New</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleCreateTask}>Task</DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Library Items</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => handleCreateLibraryItem("checklist_library")}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Checklist
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleCreateLibraryItem("credentials_library")}>
            <Key className="mr-2 h-4 w-4" />
            Credentials
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleCreateLibraryItem("brand_brief")}>
            <Palette className="mr-2 h-4 w-4" />
            Brand Brief
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleCreateLibraryItem("resource_library")}>
            <BookOpen className="mr-2 h-4 w-4" />
            Resources
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
