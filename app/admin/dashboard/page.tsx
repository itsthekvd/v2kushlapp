"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getUsersByType, getPayments } from "@/lib/storage"
import { getAllPublishedTasks } from "@/lib/task-management"
import { calculatePlatformStatistics } from "@/lib/statistics"
import { BarChart, LineChart, PieChart } from "@/components/charts"
import { Users, Briefcase, DollarSign, Activity, FileText, Ban, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMobile } from "@/hooks/use-mobile"

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const isMobile = useMobile()
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalEmployers: 0,
    totalStudents: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalRevenue: 0,
    platformCommission: 0,
    activeUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

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

    // Load dashboard data
    const loadDashboardData = () => {
      try {
        setIsLoading(true)

        // Get users
        const employers = getUsersByType("employer")
        const students = getUsersByType("student")

        // Get tasks
        const tasks = getAllPublishedTasks()
        const completedTasks = tasks.filter((task) => task.status === "completed")

        // Get payments
        const payments = getPayments()
        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
        const platformCommission = payments.reduce((sum, payment) => sum + payment.platformCommission, 0)

        // Get platform statistics
        const platformStats = calculatePlatformStatistics()

        // Calculate active users (users active in the last 7 days)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const activeUsers = [...employers, ...students].filter(
          (user) => user.lastActiveDate && user.lastActiveDate > sevenDaysAgo,
        ).length

        setStats({
          totalUsers: employers.length + students.length,
          totalEmployers: employers.length,
          totalStudents: students.length,
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          totalRevenue,
          platformCommission,
          activeUsers,
          ...platformStats,
        })

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        setIsLoading(false)
      }
    }

    loadDashboardData()

    // Refresh data every 5 minutes
    const intervalId = setInterval(loadDashboardData, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [user, router])

  if (!user || user.userType !== "admin") {
    return null
  }

  // Navigation items for admin
  const navItems = [
    { label: "Manage Users", href: "/admin/users" },
    { label: "Manage Tasks", href: "/admin/tasks" },
    { label: "Manage Payments", href: "/admin/payments" },
    { label: "User Lists", href: "/admin/user-lists" },
    { label: "Manage SOPs", href: "/admin/sop" },
    { label: "System Settings", href: "/admin/settings" },
    { label: "Activity Logs", href: "/admin/activity-logs" },
  ]

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {isMobile ? (
          // Mobile dropdown menu
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Admin Actions <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)}>
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Desktop horizontal scrollable menu
          <ScrollArea className="w-full sm:w-auto max-w-[calc(100vw-2rem)]">
            <div className="flex items-center gap-2 pb-2">
              {navItems.map((item) => (
                <Button key={item.href} variant="outline" onClick={() => router.push(item.href)}>
                  {item.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Quick access cards for important admin functions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => router.push("/admin/users")}
        >
          <CardContent className="flex flex-col items-center justify-center p-4 text-center">
            <Users className="h-8 w-8 mb-2" />
            <p className="text-sm font-medium">Users</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => router.push("/admin/tasks")}
        >
          <CardContent className="flex flex-col items-center justify-center p-4 text-center">
            <Briefcase className="h-8 w-8 mb-2" />
            <p className="text-sm font-medium">Tasks</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => router.push("/admin/user-lists")}
        >
          <CardContent className="flex flex-col items-center justify-center p-4 text-center">
            <Ban className="h-8 w-8 mb-2" />
            <p className="text-sm font-medium">User Lists</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => router.push("/admin/sop")}>
          <CardContent className="flex flex-col items-center justify-center p-4 text-center">
            <FileText className="h-8 w-8 mb-2" />
            <p className="text-sm font-medium">SOPs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.totalEmployers} employers, {stats.totalStudents} students
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Users (7d)</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                      users
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTasks}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.completedTasks} completed (
                      {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ₹{stats.platformCommission.toLocaleString()} commission
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <LineChart
                      data={[
                        { name: "Jan", Employers: stats.totalEmployers * 0.5, Students: stats.totalStudents * 0.3 },
                        { name: "Feb", Employers: stats.totalEmployers * 0.6, Students: stats.totalStudents * 0.4 },
                        { name: "Mar", Employers: stats.totalEmployers * 0.7, Students: stats.totalStudents * 0.5 },
                        { name: "Apr", Employers: stats.totalEmployers * 0.8, Students: stats.totalStudents * 0.6 },
                        { name: "May", Employers: stats.totalEmployers * 0.9, Students: stats.totalStudents * 0.8 },
                        { name: "Jun", Employers: stats.totalEmployers, Students: stats.totalStudents },
                      ]}
                      xAxisKey="name"
                      yAxisKey={["Employers", "Students"]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <BarChart
                      data={[
                        { name: "Jan", Revenue: stats.totalRevenue * 0.3, Commission: stats.platformCommission * 0.3 },
                        { name: "Feb", Revenue: stats.totalRevenue * 0.4, Commission: stats.platformCommission * 0.4 },
                        { name: "Mar", Revenue: stats.totalRevenue * 0.5, Commission: stats.platformCommission * 0.5 },
                        { name: "Apr", Revenue: stats.totalRevenue * 0.6, Commission: stats.platformCommission * 0.6 },
                        { name: "May", Revenue: stats.totalRevenue * 0.8, Commission: stats.platformCommission * 0.8 },
                        { name: "Jun", Revenue: stats.totalRevenue, Commission: stats.platformCommission },
                      ]}
                      xAxisKey="name"
                      yAxisKey={["Revenue", "Commission"]}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Task Status</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
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
                    <CardTitle>User Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
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
                    <CardTitle>Task Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <PieChart
                      data={
                        stats.categoryData || [
                          { name: "Design", value: Math.round(stats.totalTasks * 0.35) },
                          { name: "Development", value: Math.round(stats.totalTasks * 0.4) },
                          { name: "Marketing", value: Math.round(stats.totalTasks * 0.15) },
                          { name: "Content", value: Math.round(stats.totalTasks * 0.1) },
                        ]
                      }
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">User Acquisition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <LineChart
                        data={[
                          { name: "Week 1", Users: Math.round(stats.totalUsers * 0.25) },
                          { name: "Week 2", Users: Math.round(stats.totalUsers * 0.4) },
                          { name: "Week 3", Users: Math.round(stats.totalUsers * 0.6) },
                          { name: "Week 4", Users: stats.totalUsers },
                        ]}
                        xAxisKey="name"
                        yAxisKey={["Users"]}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Daily Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <LineChart
                        data={[
                          { name: "Mon", Users: Math.round(stats.activeUsers * 0.8) },
                          { name: "Tue", Users: Math.round(stats.activeUsers * 0.9) },
                          { name: "Wed", Users: Math.round(stats.activeUsers * 0.85) },
                          { name: "Thu", Users: stats.activeUsers },
                          { name: "Fri", Users: Math.round(stats.activeUsers * 0.95) },
                          { name: "Sat", Users: Math.round(stats.activeUsers * 0.8) },
                          { name: "Sun", Users: Math.round(stats.activeUsers * 0.7) },
                        ]}
                        xAxisKey="name"
                        yAxisKey={["Users"]}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">User Retention</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <LineChart
                        data={[
                          { name: "Week 1", Retention: 100 },
                          { name: "Week 2", Retention: 85 },
                          { name: "Week 3", Retention: 75 },
                          { name: "Week 4", Retention: 68 },
                        ]}
                        xAxisKey="name"
                        yAxisKey={["Retention"]}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={() => router.push("/admin/users")}>View Detailed User Analytics</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Task Creation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <BarChart
                        data={[
                          { name: "Week 1", Tasks: Math.round(stats.totalTasks * 0.25) },
                          { name: "Week 2", Tasks: Math.round(stats.totalTasks * 0.4) },
                          { name: "Week 3", Tasks: Math.round(stats.totalTasks * 0.6) },
                          { name: "Week 4", Tasks: stats.totalTasks },
                        ]}
                        xAxisKey="name"
                        yAxisKey={["Tasks"]}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Task Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <LineChart
                        data={[
                          { name: "Week 1", Rate: 70 },
                          { name: "Week 2", Rate: 75 },
                          { name: "Week 3", Rate: 82 },
                          { name: "Week 4", Rate: 85 },
                        ]}
                        xAxisKey="name"
                        yAxisKey={["Rate"]}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Task Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <PieChart
                        data={
                          stats.categoryData || [
                            { name: "Design", value: Math.round(stats.totalTasks * 0.35) },
                            { name: "Development", value: Math.round(stats.totalTasks * 0.4) },
                            { name: "Marketing", value: Math.round(stats.totalTasks * 0.15) },
                            { name: "Content", value: Math.round(stats.totalTasks * 0.1) },
                          ]
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={() => router.push("/admin/tasks")}>View Detailed Task Analytics</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Monthly Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <BarChart
                        data={[
                          { name: "Jan", Revenue: Math.round(stats.totalRevenue * 0.3) },
                          { name: "Feb", Revenue: Math.round(stats.totalRevenue * 0.4) },
                          { name: "Mar", Revenue: Math.round(stats.totalRevenue * 0.5) },
                          { name: "Apr", Revenue: Math.round(stats.totalRevenue * 0.6) },
                          { name: "May", Revenue: Math.round(stats.totalRevenue * 0.8) },
                          { name: "Jun", Revenue: stats.totalRevenue },
                        ]}
                        xAxisKey="name"
                        yAxisKey={["Revenue"]}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Commission Rate Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <LineChart
                        data={[
                          { name: "5%", Revenue: stats.totalRevenue, Tasks: stats.totalTasks },
                          {
                            name: "7%",
                            Revenue: Math.round(stats.totalRevenue * 0.95),
                            Tasks: Math.round(stats.totalTasks * 0.95),
                          },
                          {
                            name: "10%",
                            Revenue: Math.round(stats.totalRevenue * 0.9),
                            Tasks: Math.round(stats.totalTasks * 0.85),
                          },
                          {
                            name: "15%",
                            Revenue: Math.round(stats.totalRevenue * 0.8),
                            Tasks: Math.round(stats.totalTasks * 0.7),
                          },
                        ]}
                        xAxisKey="name"
                        yAxisKey={["Revenue", "Tasks"]}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Revenue by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <PieChart
                        data={[
                          { name: "Design", value: Math.round(stats.totalRevenue * 0.3) },
                          { name: "Development", value: Math.round(stats.totalRevenue * 0.4) },
                          { name: "Marketing", value: Math.round(stats.totalRevenue * 0.2) },
                          { name: "Content", value: Math.round(stats.totalRevenue * 0.1) },
                        ]}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={() => router.push("/admin/payments")}>View Detailed Revenue Analytics</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
