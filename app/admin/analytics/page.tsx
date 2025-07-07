"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculatePlatformStatistics, getPopularCategories } from "@/lib/statistics"
import { getUsersByType, getPayments } from "@/lib/storage"
import { getAllPublishedTasks } from "@/lib/task-management"
import { BarChart, LineChart, PieChart } from "@/components/charts"
import { format, subDays, subMonths } from "date-fns"

export default function AdminAnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("30days")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const [userGrowthData, setUserGrowthData] = useState<any[]>([])
  const [taskCompletionData, setTaskCompletionData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])

  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "admin") {
      router.push("/")
      return
    }

    // Load analytics data
    const loadAnalyticsData = () => {
      try {
        setIsLoading(true)

        // Get platform statistics
        const platformStats = calculatePlatformStatistics()

        // Get users
        const employers = getUsersByType("employer")
        const students = getUsersByType("student")

        // Get tasks
        const tasks = getAllPublishedTasks()

        // Get payments
        const payments = getPayments()

        // Calculate time-based metrics based on selected time range
        const timeRangeDate = getTimeRangeDate(timeRange)

        // Filter data by time range
        const recentEmployers = employers.filter((emp) => emp.lastActiveDate && emp.lastActiveDate > timeRangeDate)
        const recentStudents = students.filter((stu) => stu.lastActiveDate && stu.lastActiveDate > timeRangeDate)
        const recentTasks = tasks.filter((task) => task.createdAt > timeRangeDate)
        const recentCompletedTasks = tasks.filter(
          (task) => task.status === "completed" && task.completedAt && task.completedAt > timeRangeDate,
        )
        const recentPayments = payments.filter((payment) => payment.createdAt > timeRangeDate)

        // Calculate total revenue in time range
        const recentRevenue = recentPayments.reduce((sum, payment) => sum + payment.amount, 0)
        const recentCommission = recentPayments.reduce((sum, payment) => sum + payment.platformCommission, 0)

        // Set stats
        setStats({
          ...platformStats,
          recentEmployers: recentEmployers.length,
          recentStudents: recentStudents.length,
          recentTasks: recentTasks.length,
          recentCompletedTasks: recentCompletedTasks.length,
          recentRevenue,
          recentCommission,
        })

        // Generate user growth data
        setUserGrowthData(generateUserGrowthData(employers, students, timeRange))

        // Generate task completion data
        setTaskCompletionData(generateTaskCompletionData(tasks, timeRange))

        // Generate revenue data
        setRevenueData(generateRevenueData(payments, timeRange))

        // Generate category data
        setCategoryData(getPopularCategories(10).map((cat) => ({ name: cat.name, value: cat.count })))

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading analytics data:", error)
        setIsLoading(false)
      }
    }

    loadAnalyticsData()

    // Refresh data every 5 minutes
    const intervalId = setInterval(loadAnalyticsData, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [user, router, timeRange])

  const getTimeRangeDate = (range: string): number => {
    const now = new Date()
    switch (range) {
      case "7days":
        return subDays(now, 7).getTime()
      case "30days":
        return subDays(now, 30).getTime()
      case "90days":
        return subDays(now, 90).getTime()
      case "6months":
        return subMonths(now, 6).getTime()
      case "1year":
        return subMonths(now, 12).getTime()
      default:
        return subDays(now, 30).getTime()
    }
  }

  const generateUserGrowthData = (employers: any[], students: any[], timeRange: string): any[] => {
    // This is a simplified example - in a real app, you would aggregate actual user registration dates
    const intervals = getIntervalsForTimeRange(timeRange)
    const data = []

    for (let i = 0; i < intervals.length; i++) {
      const date = intervals[i]
      const nextDate = i < intervals.length - 1 ? intervals[i + 1] : Date.now()

      const employersInPeriod = employers.filter(
        (emp) => emp.lastActiveDate && emp.lastActiveDate >= date && emp.lastActiveDate < nextDate,
      ).length
      const studentsInPeriod = students.filter(
        (stu) => stu.lastActiveDate && stu.lastActiveDate >= date && stu.lastActiveDate < nextDate,
      ).length

      data.push({
        name: format(new Date(date), getFormatStringForTimeRange(timeRange)),
        Employers: employersInPeriod,
        Students: studentsInPeriod,
      })
    }

    return data
  }

  const generateTaskCompletionData = (tasks: any[], timeRange: string): any[] => {
    const intervals = getIntervalsForTimeRange(timeRange)
    const data = []

    for (let i = 0; i < intervals.length; i++) {
      const date = intervals[i]
      const nextDate = i < intervals.length - 1 ? intervals[i + 1] : Date.now()

      const tasksCreated = tasks.filter((task) => task.createdAt >= date && task.createdAt < nextDate).length
      const tasksCompleted = tasks.filter(
        (task) =>
          task.status === "completed" && task.completedAt && task.completedAt >= date && task.completedAt < nextDate,
      ).length

      data.push({
        name: format(new Date(date), getFormatStringForTimeRange(timeRange)),
        Created: tasksCreated,
        Completed: tasksCompleted,
      })
    }

    return data
  }

  const generateRevenueData = (payments: any[], timeRange: string): any[] => {
    const intervals = getIntervalsForTimeRange(timeRange)
    const data = []

    for (let i = 0; i < intervals.length; i++) {
      const date = intervals[i]
      const nextDate = i < intervals.length - 1 ? intervals[i + 1] : Date.now()

      const paymentsInPeriod = payments.filter((payment) => payment.createdAt >= date && payment.createdAt < nextDate)
      const revenue = paymentsInPeriod.reduce((sum, payment) => sum + payment.amount, 0)
      const commission = paymentsInPeriod.reduce((sum, payment) => sum + payment.platformCommission, 0)

      data.push({
        name: format(new Date(date), getFormatStringForTimeRange(timeRange)),
        Revenue: revenue,
        Commission: commission,
      })
    }

    return data
  }

  const getIntervalsForTimeRange = (timeRange: string): number[] => {
    const now = new Date()
    const intervals = []

    switch (timeRange) {
      case "7days":
        for (let i = 6; i >= 0; i--) {
          intervals.push(subDays(now, i).getTime())
        }
        break
      case "30days":
        for (let i = 6; i >= 0; i--) {
          intervals.push(subDays(now, i * 5).getTime())
        }
        break
      case "90days":
        for (let i = 6; i >= 0; i--) {
          intervals.push(subDays(now, i * 15).getTime())
        }
        break
      case "6months":
        for (let i = 6; i >= 0; i--) {
          intervals.push(subMonths(now, i).getTime())
        }
        break
      case "1year":
        for (let i = 12; i >= 0; i--) {
          intervals.push(subMonths(now, i).getTime())
        }
        break
      default:
        for (let i = 6; i >= 0; i--) {
          intervals.push(subDays(now, i * 5).getTime())
        }
    }

    return intervals
  }

  const getFormatStringForTimeRange = (timeRange: string): string => {
    switch (timeRange) {
      case "7days":
        return "EEE"
      case "30days":
      case "90days":
        return "MMM d"
      case "6months":
      case "1year":
        return "MMM yyyy"
      default:
        return "MMM d"
    }
  }

  if (!user || user.userType !== "admin") {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Button onClick={() => router.push("/admin/dashboard")}>Back to Dashboard</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <div className="w-full sm:w-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="6months">Last 6 months</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Overview content */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Users</CardTitle>
                    <CardDescription>Total registered users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEmployers + stats.totalStudents}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.recentEmployers + stats.recentStudents} active in selected period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                    <CardDescription>Total published tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTasks}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.completedTasks} completed ({Math.round((stats.completedTasks / stats.totalTasks) * 100)}%)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <CardDescription>Total platform revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.totalPayouts?.toLocaleString() || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ₹{stats.recentRevenue?.toLocaleString() || 0} in selected period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Commission</CardTitle>
                    <CardDescription>Platform commission earned</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.platformCommission?.toLocaleString() || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ₹{stats.recentCommission?.toLocaleString() || 0} in selected period
                    </p>
                  </CardContent>
                </Card>
              </div>
              {/* Rest of overview content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New users over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <LineChart data={userGrowthData} xAxisKey="name" yAxisKey={["Employers", "Students"]} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue</CardTitle>
                    <CardDescription>Revenue and commission over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <BarChart data={revenueData} xAxisKey="name" yAxisKey={["Revenue", "Commission"]} />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Task Completion</CardTitle>
                    <CardDescription>Tasks created vs completed</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <LineChart data={taskCompletionData} xAxisKey="name" yAxisKey={["Created", "Completed"]} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Popular Categories</CardTitle>
                    <CardDescription>Tasks by category</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <PieChart data={categoryData} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-0 space-y-6">
              {/* Users content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                    <CardDescription>Employers vs Students</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <PieChart
                      data={[
                        { name: "Employers", value: stats.totalEmployers },
                        { name: "Students", value: stats.totalStudents },
                      ]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New users over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <LineChart data={userGrowthData} xAxisKey="name" yAxisKey={["Employers", "Students"]} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>Active users over time</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <LineChart
                    data={userGrowthData.map((item) => ({
                      name: item.name,
                      "Active Users": (item.Employers + item.Students) * 0.7, // Simulated active users
                    }))}
                    xAxisKey="name"
                    yAxisKey={["Active Users"]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Retention</CardTitle>
                  <CardDescription>User retention rate over time</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <LineChart
                    data={[
                      { name: "Week 1", Retention: 100 },
                      { name: "Week 2", Retention: 85 },
                      { name: "Week 3", Retention: 75 },
                      { name: "Week 4", Retention: 68 },
                      { name: "Week 5", Retention: 65 },
                      { name: "Week 6", Retention: 62 },
                      { name: "Week 7", Retention: 60 },
                    ]}
                    xAxisKey="name"
                    yAxisKey={["Retention"]}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-0 space-y-6">
              {/* Tasks content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Task Status</CardTitle>
                    <CardDescription>Distribution of task statuses</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <PieChart
                      data={[
                        { name: "Completed", value: stats.completedTasks },
                        { name: "In Progress", value: stats.totalTasks - stats.completedTasks },
                      ]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Task Categories</CardTitle>
                    <CardDescription>Tasks by category</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <PieChart data={categoryData} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Task Creation & Completion</CardTitle>
                  <CardDescription>Tasks created vs completed over time</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <LineChart data={taskCompletionData} xAxisKey="name" yAxisKey={["Created", "Completed"]} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Completion Time</CardTitle>
                  <CardDescription>Average time to complete tasks (hours)</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <BarChart
                    data={[
                      { name: "Design", Hours: 24 },
                      { name: "Development", Hours: 48 },
                      { name: "Marketing", Hours: 12 },
                      { name: "Content", Hours: 8 },
                      { name: "Research", Hours: 16 },
                    ]}
                    xAxisKey="name"
                    yAxisKey={["Hours"]}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="mt-0 space-y-6">
              {/* Revenue content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Total revenue and commission</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <PieChart
                      data={[
                        { name: "Student Earnings", value: stats.totalPayouts - stats.platformCommission },
                        { name: "Platform Commission", value: stats.platformCommission },
                      ]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Revenue over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <LineChart data={revenueData} xAxisKey="name" yAxisKey={["Revenue"]} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Commission</CardTitle>
                  <CardDescription>Revenue and commission over time</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <BarChart data={revenueData} xAxisKey="name" yAxisKey={["Revenue", "Commission"]} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                  <CardDescription>Revenue distribution across categories</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <BarChart
                    data={[
                      { name: "Design", Revenue: 45000 },
                      { name: "Development", Revenue: 65000 },
                      { name: "Marketing", Revenue: 25000 },
                      { name: "Content", Revenue: 15000 },
                      { name: "Research", Revenue: 20000 },
                    ]}
                    xAxisKey="name"
                    yAxisKey={["Revenue"]}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
