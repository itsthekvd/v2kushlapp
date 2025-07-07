"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useGamification } from "@/contexts/gamification-context"
import {
  ChevronRight,
  TrendingUp,
  Award,
  PlusSquare,
  ClipboardList,
  FileText,
  Users,
  LogOut,
  Wallet,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getProjects } from "@/lib/task-management"
import { formatDistanceToNow } from "date-fns"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const gamification = useGamification()
  const [profileCompletion, setProfileCompletion] = useState(0)
  const router = useRouter()

  const { streak, level, points, achievements } = gamification

  // Add these state variables and data fetching logic:
  const [stats, setStats] = useState({
    totalTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    publishedTasks: 0,
  })
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    potentialEarnings: 0,
  })

  // Redirect non-logged in users to homepage
  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  // Calculate profile completion percentage
  const getProfileCompletion = () => {
    if (!user) return 0

    let completed = 0
    const total = 4 // Basic info, payment, profile, compliance

    // Basic info is always completed during registration
    completed += 1

    // Check payment details
    if (user.payment?.bankAccountName) completed += 1

    // Check profile details
    if (user.userType === "student" && user.profile?.profilePicture) completed += 1
    if (user.userType === "employer" && user.profile?.companyLogo) completed += 1

    // Check compliance details
    if (user.compliance?.panCard) completed += 1

    return Math.round((completed / total) * 100)
  }

  useEffect(() => {
    setProfileCompletion(getProfileCompletion())
  }, [user])

  // Update profile completion achievement
  useEffect(() => {
    if (user) {
      const { updateAchievementProgress } = gamification
      const completedSections = Math.floor((profileCompletion / 100) * 4)
      updateAchievementProgress("profile_complete", completedSections)
    }
  }, [profileCompletion, user, gamification])

  // Add this useEffect to load real data:
  useEffect(() => {
    if (!user) return

    const loadDashboardData = async () => {
      setIsLoading(true)
      try {
        // Get all tasks for this user
        const projects = getProjects(user.id)
        let allTasks: any[] = []

        projects.forEach((project) => {
          project.sprints.forEach((sprint) => {
            sprint.campaigns.forEach((campaign) => {
              allTasks = [...allTasks, ...campaign.tasks]
            })
          })
        })

        // Calculate task stats
        const totalTasks = allTasks.filter(
          (t) => !["checklist_library", "credentials_library", "brand_brief", "resource_library"].includes(t.status),
        ).length

        const inProgressTasks = allTasks.filter(
          (t) =>
            t.status === "in_progress" &&
            !["checklist_library", "credentials_library", "brand_brief", "resource_library"].includes(t.status),
        ).length

        const completedTasks = allTasks.filter(
          (t) =>
            t.status === "completed" &&
            !["checklist_library", "credentials_library", "brand_brief", "resource_library"].includes(t.status),
        ).length

        const publishedTasks = allTasks.filter(
          (t) =>
            t.isPublished &&
            !["checklist_library", "credentials_library", "brand_brief", "resource_library"].includes(t.status),
        ).length

        setStats({
          totalTasks,
          inProgressTasks,
          completedTasks,
          publishedTasks,
        })

        // Get recent applications
        const tasksWithApplications = allTasks.filter((t) => t.applications && t.applications.length > 0)
        const applications = []

        for (const task of tasksWithApplications) {
          for (const app of task.applications) {
            applications.push({
              ...app,
              taskTitle: task.title,
              isNew: Date.now() - app.createdAt < 24 * 60 * 60 * 1000, // Less than 24 hours old
            })
          }
        }

        // Sort by creation date (newest first) and take the first 2
        const sortedApplications = applications.sort((a, b) => b.createdAt - a.createdAt).slice(0, 2)
        setRecentApplications(sortedApplications)

        // For student users, calculate earnings data
        if (user.userType === "student") {
          // This is simplified - in a real app, you would fetch this from your backend
          setEarningsData({
            totalEarnings: 15000, // Example value
            pendingEarnings: 5000, // Example value
            potentialEarnings: 8000, // Example value
          })
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()

    // Refresh data every minute
    const intervalId = setInterval(loadDashboardData, 60000)
    return () => clearInterval(intervalId)
  }, [user])

  if (!user) return null

  return (
    <div className="container space-y-6 py-6">
      {/* User welcome card with gamification */}
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 to-background shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`}>
              <Avatar className="h-12 w-12 border-2 border-primary/20 cursor-pointer hover:border-primary transition-colors">
                <AvatarImage
                  src={user.userType === "student" ? user.profile?.profilePicture : user.profile?.companyLogo}
                />
                <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <h2 className="font-semibold">Welcome back, {user.fullName.split(" ")[0]}!</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  <span>Level {level}</span>
                </div>
                <span>•</span>
                <div>{points} points</div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{streak} day streak</span>
                </div>
              </div>
            </div>
          </div>

          {profileCompletion < 100 && (
            <div className="mt-4 rounded-lg bg-background p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Complete your profile</div>
                <Badge variant="outline">{profileCompletion}%</Badge>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <Link href="/profile" className="mt-2 flex items-center justify-end text-xs text-primary">
                <span>Continue</span>
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button
            variant="outline"
            className="flex h-auto flex-col items-center justify-center gap-2 p-4"
            onClick={() => router.push("/post")}
          >
            <PlusSquare className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium">Create Task</span>
          </Button>

          <Button
            variant="outline"
            className="flex h-auto flex-col items-center justify-center gap-2 p-4"
            onClick={() => router.push("/my-tasks")}
          >
            <ClipboardList className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium">My Tasks</span>
          </Button>

          <Button
            variant="outline"
            className="flex h-auto flex-col items-center justify-center gap-2 p-4"
            onClick={() => router.push("/applications")}
          >
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium">Applications</span>
          </Button>

          <Button
            variant="outline"
            className="flex h-auto flex-col items-center justify-center gap-2 p-4"
            onClick={() =>
              router.push(
                user?.userType === "employer" ? "/sop" : user?.userType === "student" ? "/earnings" : "/profile",
              )
            }
          >
            {user?.userType === "employer" ? (
              <>
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium">SOPs</span>
              </>
            ) : user?.userType === "student" ? (
              <>
                <Wallet className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium">Earnings</span>
              </>
            ) : (
              <>
                <Users className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium">Team</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Student Earnings Summary (only for students) */}
      {user.userType === "student" && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Earnings Summary</CardTitle>
              <Link href="/earnings" className="text-xs text-primary flex items-center">
                View Details <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="text-lg font-semibold">₹{earningsData.totalEarnings.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-semibold">₹{earningsData.pendingEarnings.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Potential</p>
                <p className="text-lg font-semibold">₹{earningsData.potentialEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Tasks</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Tasks</span>
                        <span className="font-medium">{stats.totalTasks || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">In Progress</span>
                        <span className="font-medium">{stats.inProgressTasks || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Completed</span>
                        <span className="font-medium">{stats.completedTasks || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Published</span>
                        <span className="font-medium">{stats.publishedTasks || 0}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4">
              <Link href="/my-tasks" className="flex items-center justify-end text-xs text-primary">
                <span>View all tasks</span>
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : recentApplications && recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.map((app, i) => (
                  <div key={app.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{app.studentName?.[0] || "S"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{app.studentName || `Student ${i + 1}`}</div>
                        <div className="text-xs text-muted-foreground">Applied for {app.taskTitle || "Task"}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {app.isNew ? "New" : formatDistanceToNow(app.createdAt, { addSuffix: true })}
                    </Badge>
                  </div>
                ))}
                <div className="mt-2">
                  <Link href="/applications" className="flex items-center justify-end text-xs text-primary">
                    <span>View all applications</span>
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No applications yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent achievements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Achievements</h2>
          <Link href="/achievements" className="flex items-center text-xs text-primary">
            <span>View all</span>
            <ChevronRight className="ml-1 h-3 w-3" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {achievements
            .filter((a) => a.unlocked)
            .slice(0, 3)
            .map((achievement) => (
              <div
                key={achievement.id}
                className="flex min-w-[140px] flex-col items-center rounded-lg border bg-card p-3 text-center"
              >
                <div className="text-3xl">{achievement.icon}</div>
                <div className="mt-2 text-sm font-medium">{achievement.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">+{achievement.points} points</div>
              </div>
            ))}

          {achievements.filter((a) => a.unlocked).length === 0 && (
            <div className="flex w-full flex-col items-center rounded-lg border border-dashed p-6 text-center">
              <Award className="h-8 w-8 text-muted-foreground/50" />
              <div className="mt-2 text-sm font-medium">No achievements yet</div>
              <div className="mt-1 text-xs text-muted-foreground">Complete tasks to earn achievements</div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="flex justify-center mt-8 mb-4">
        <Button
          variant="outline"
          className="w-full max-w-xs border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  )
}
