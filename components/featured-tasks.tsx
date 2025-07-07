"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getFeaturedTasks, getPopularCategories } from "@/lib/statistics"
import { findUserById } from "@/lib/storage"
import { Clock, DollarSign, Tag, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Task } from "@/lib/task-management"
import { TASK_CATEGORIES } from "@/lib/task-management"

export function FeaturedTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Get featured tasks and categories on client-side
    const featuredTasks = getFeaturedTasks(12)

    // Get popular categories but ensure we're using the same categories as everywhere else
    const popularCategories = getPopularCategories().filter((cat) => TASK_CATEGORIES.includes(cat.name))

    setTasks(featuredTasks)
    setCategories(popularCategories)
    setIsLoaded(true)
  }, [])

  // Filter tasks based on category and search query
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = !selectedCategory || task.category === selectedCategory
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatTimeAgo = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A"

    const now = Date.now()
    const diff = now - timestamp

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${minutes}m ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-8"
          >
            All
          </Button>

          {categories.map((category) => (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.name)}
              className="h-8"
            >
              {category.name} ({category.count})
            </Button>
          ))}
        </div>
      </div>

      {isLoaded ? (
        filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">No tasks found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  )
}

interface TaskCardProps {
  task: Task
}

function TaskCard({ task }: TaskCardProps) {
  // Get employer info
  const getEmployerInitials = () => {
    const projects = JSON.parse(localStorage.getItem("kushl_projects") || "[]")
    let ownerId = ""

    // Find the project that contains this task
    for (const project of projects) {
      for (const sprint of project.sprints) {
        for (const campaign of sprint.campaigns) {
          if (campaign.tasks.some((t) => t.id === task.id)) {
            ownerId = project.ownerId
            break
          }
        }
      }
    }

    if (!ownerId) return "EM"

    const employer = findUserById(ownerId)
    if (!employer) return "EM"

    const nameParts = employer.fullName.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }
    return employer.fullName.substring(0, 2).toUpperCase()
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatTimeAgo = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A"

    const now = Date.now()
    const diff = now - timestamp

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${minutes}m ago`
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        <Link href={`/task/${task.id}`}>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                {task.category && (
                  <Badge variant="outline" className="mb-2">
                    {task.category}
                  </Badge>
                )}
                <h3 className="line-clamp-1 font-semibold">{task.title}</h3>
                {task.description && <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>}
              </div>
              <Avatar className="mt-1 h-10 w-10 rounded-md">
                <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                  {getEmployerInitials()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {task.price && (
                <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                  <DollarSign className="h-3 w-3" />
                  <span>{formatCurrency(task.price)}</span>
                </div>
              )}

              {task.publishedAt && (
                <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAgo(task.publishedAt)}</span>
                </div>
              )}

              {task.skills && task.skills.length > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                  <Tag className="h-3 w-3" />
                  <span>
                    {task.skills[0]}
                    {task.skills.length > 1 ? ` +${task.skills.length - 1}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}

function TaskCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="w-3/4 space-y-2">
            <div className="h-5 w-16 animate-pulse rounded bg-muted"></div>
            <div className="h-6 w-full animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted"></div>
          </div>
          <div className="h-10 w-10 animate-pulse rounded-md bg-muted"></div>
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted"></div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted"></div>
        </div>
      </CardContent>
    </Card>
  )
}
