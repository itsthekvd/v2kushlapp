"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { calculatePlatformStatistics } from "@/lib/statistics"
import { Users, Briefcase, CheckCircle, Clock, MessageSquare, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

export function PlatformStats({ className }: { className?: string }) {
  const [stats, setStats] = useState({
    totalEmployers: 0,
    totalStudents: 0,
    totalTasks: 0,
    completedTasks: 0,
    averagePayout: 0,
    totalPayouts: 0,
    averageTimelineMessages: 0,
    totalTimelineMessages: 0,
    averageCompletionTimeHours: 0,
    taskSuccessRate: 0,
    activeProjects: 0,
  })

  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Calculate statistics on client-side
    const platformStats = calculatePlatformStatistics()
    setStats(platformStats)
    setIsLoaded(true)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6", className)}>
      <StatCard
        icon={<Users className="h-5 w-5 text-blue-500" />}
        label="Students"
        value={stats.totalStudents}
        isLoaded={isLoaded}
      />

      <StatCard
        icon={<Briefcase className="h-5 w-5 text-indigo-500" />}
        label="Employers"
        value={stats.totalEmployers}
        isLoaded={isLoaded}
      />

      <StatCard
        icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        label="Tasks Completed"
        value={stats.completedTasks}
        isLoaded={isLoaded}
      />

      <StatCard
        icon={<Clock className="h-5 w-5 text-amber-500" />}
        label="Avg. Completion"
        value={`${Math.round(stats.averageCompletionTimeHours)}h`}
        isLoaded={isLoaded}
      />

      <StatCard
        icon={<MessageSquare className="h-5 w-5 text-purple-500" />}
        label="Messages"
        value={stats.totalTimelineMessages}
        isLoaded={isLoaded}
      />

      <StatCard
        icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
        label="Avg. Payout"
        value={formatCurrency(stats.averagePayout)}
        isLoaded={isLoaded}
      />
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  isLoaded: boolean
}

function StatCard({ icon, label, value, isLoaded }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="mt-2 text-2xl font-bold">
          {isLoaded ? value : <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>}
        </div>
      </CardContent>
    </Card>
  )
}
