"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAllPublishedTasks, type Task, getStudentApplication, canStudentApplyForTask } from "@/lib/task-management"
import { Search, Briefcase, GraduationCap, Clock, Tag, Banknote, X, SlidersHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { TASK_CATEGORIES, formatPrice, calculateStudentEarnings } from "@/lib/constants"
import { toast } from "sonner"

// Payment range options
const PAYMENT_FILTERS = [
  { value: "all", label: "All Payments" },
  { value: "paid", label: "Paid Only" },
  { value: "low", label: "Low Pay" },
  { value: "medium", label: "Medium Pay" },
  { value: "high", label: "High Pay" },
]

// Sort options
const SORT_OPTIONS = [
  { value: "recent", label: "Recently Posted" },
  { value: "deadline-soon", label: "Deadline Soon" },
  { value: "deadline-later", label: "Deadline Later" },
  { value: "highest-pay", label: "Highest Pay" },
  { value: "lowest-pay", label: "Lowest Pay" },
]

export default function ExplorePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [publishedTasks, setPublishedTasks] = useState<Task[]>([])

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<string>("all")
  const [sortOption, setSortOption] = useState<string>("recent")
  const [showApplied, setShowApplied] = useState<boolean>(false)
  const [activeFilters, setActiveFilters] = useState<number>(0)

  // Mobile filter sheet state
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Load tasks
  useEffect(() => {
    // Load published tasks
    const tasks = getAllPublishedTasks()
    setPublishedTasks(tasks)

    // Set up an interval to refresh the tasks every 30 seconds
    const intervalId = setInterval(() => {
      const updatedTasks = getAllPublishedTasks()
      setPublishedTasks(updatedTasks)
    }, 30000)

    return () => clearInterval(intervalId)
  }, [])

  // Count active filters
  useEffect(() => {
    let count = 0
    if (selectedCategory !== "all") count++
    if (selectedPayment !== "all") count++
    if (showApplied) count++
    setActiveFilters(count)
  }, [selectedCategory, selectedPayment, showApplied])

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSelectedCategory("all")
    setSelectedPayment("all")
    setShowApplied(false)
    setSortOption("recent")
  }, [])

  // Filter and sort tasks
  const filteredAndSortedTasks = useCallback(() => {
    // First, filter the tasks
    const filtered = publishedTasks.filter((task) => {
      // Search query filter
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

      // Category filter
      const matchesCategory = selectedCategory === "all" || task.category === selectedCategory

      // Payment filter
      let matchesPayment = true
      if (selectedPayment === "paid") {
        matchesPayment = !!task.price && task.price > 0
      } else if (selectedPayment === "low") {
        matchesPayment = !!task.price && task.price <= 1000
      } else if (selectedPayment === "medium") {
        matchesPayment = !!task.price && task.price > 1000 && task.price <= 5000
      } else if (selectedPayment === "high") {
        matchesPayment = !!task.price && task.price > 5000
      }

      // Applied filter
      let matchesApplied = true
      if (showApplied && user) {
        const application = getStudentApplication(task.id, user.id)
        matchesApplied = !!application
      }

      return matchesSearch && matchesCategory && matchesPayment && matchesApplied
    })

    // Then, sort the filtered tasks
    return filtered.sort((a, b) => {
      if (sortOption === "recent") {
        return b.createdAt - a.createdAt
      } else if (sortOption === "deadline-soon") {
        // If no deadline, put at the end
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate - b.dueDate
      } else if (sortOption === "deadline-later") {
        // If no deadline, put at the end
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return b.dueDate - a.dueDate
      } else if (sortOption === "highest-pay") {
        const aPrice = a.price || 0
        const bPrice = b.price || 0
        return bPrice - aPrice
      } else if (sortOption === "lowest-pay") {
        const aPrice = a.price || 0
        const bPrice = b.price || 0
        return aPrice - bPrice
      }
      return 0
    })
  }, [publishedTasks, searchQuery, selectedCategory, selectedPayment, sortOption, showApplied, user])

  const tasks = filteredAndSortedTasks()

  const handleApply = () => {
    if (!user) {
      router.push("/login")
      return
    }

    // Check if student can apply for more tasks
    if (user.userType === "student") {
      const { canApply, reason } = canStudentApplyForTask(user.id)

      if (!canApply) {
        toast({
          title: "Cannot apply",
          description: reason || "You cannot apply for more tasks at this time.",
          variant: "destructive",
        })
        return
      }
    }

    // Open application dialog
    // setIsApplicationDialogOpen(true);
  }

  return (
    <div className="container space-y-4 py-4">
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">Explore Opportunities</h1>
        <p className="text-sm text-muted-foreground">Find the perfect opportunity for you</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search opportunities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 pr-12"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter bar - Mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="flex-1 h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-3 relative">
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Filters
              {activeFilters > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filter Tasks</SheetTitle>
              <SheetDescription>Narrow down tasks to find exactly what you're looking for</SheetDescription>
            </SheetHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Category</h3>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {TASK_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Payment</h3>
                <Select value={selectedPayment} onValueChange={setSelectedPayment}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="show-applied"
                  checked={showApplied}
                  onCheckedChange={(checked) => setShowApplied(!!checked)}
                />
                <label
                  htmlFor="show-applied"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Show only tasks I've applied to
                </label>
              </div>
            </div>

            <SheetFooter className="flex-row gap-3 sm:justify-between">
              <Button variant="outline" onClick={resetFilters} className="flex-1">
                Reset Filters
              </Button>
              <SheetClose asChild>
                <Button className="flex-1">Apply Filters</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filter bar - Desktop */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TASK_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPayment} onValueChange={setSelectedPayment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-applied-desktop"
            checked={showApplied}
            onCheckedChange={(checked) => setShowApplied(!!checked)}
          />
          <label
            htmlFor="show-applied-desktop"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show applied
          </label>
        </div>

        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedCategory !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {selectedCategory}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setSelectedCategory("all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {selectedPayment !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {PAYMENT_FILTERS.find((p) => p.value === selectedPayment)?.label}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setSelectedPayment("all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {showApplied && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Applied Tasks
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => setShowApplied(false)}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Tasks list */}
      <div className="space-y-3 pt-2">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <Card key={task.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 cursor-pointer" onClick={() => router.push(`/opportunity/${task.id}`)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {task.priority === "low"
                          ? "Easy"
                          : task.priority === "medium"
                            ? "Medium"
                            : task.priority === "high"
                              ? "Hard"
                              : "Urgent"}
                      </Badge>
                      <h3 className="font-semibold">{task.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {task.description || "No description provided"}
                      </p>
                    </div>
                    <Avatar className="mt-1 h-10 w-10 rounded-md">
                      <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                        {task.title.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                      <Briefcase className="h-3 w-3" />
                      <span>Remote</span>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                      <GraduationCap className="h-3 w-3" />
                      <span>
                        {task.priority === "low"
                          ? "Entry Level"
                          : task.priority === "medium"
                            ? "Intermediate"
                            : "Advanced"}
                      </span>
                    </div>
                    {task.category && (
                      <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                        <Tag className="h-3 w-3" />
                        <span>{task.category}</span>
                      </div>
                    )}
                    {task.price && (
                      <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                        <Banknote className="h-3 w-3" />
                        <span>{formatPrice(calculateStudentEarnings(task.price))}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>
                        Posted {Math.floor((Date.now() - task.createdAt) / (1000 * 60 * 60 * 24)) || 1}
                        {Math.floor((Date.now() - task.createdAt) / (1000 * 60 * 60 * 24)) === 1 ? " day" : " days"} ago
                      </span>
                    </div>

                    {/* Show if student has applied */}
                    {user && getStudentApplication(task.id, user.id) && (
                      <div className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">
                        <span>Applied</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No opportunities found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            {activeFilters > 0 && (
              <Button variant="outline" onClick={resetFilters} className="mt-4">
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
