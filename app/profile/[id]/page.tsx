/* LOCKED_SECTION: public-profile - DO NOT MODIFY
 * Description: Public profile page for students and employers
 * Last verified working: 2025-05-09
 * Dependencies: auth-context, profile-scoring.ts, storage.ts
 * Checksum: 9f8e7d6c5b4a3f2e
 */
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  GraduationCap,
  Globe,
  ChevronRight,
  Users,
  Linkedin,
  Twitter,
  Facebook,
  Building,
  Star,
  Mail,
  Phone,
  MapPin,
  Share2,
  Copy,
  UserPlus,
  MessageSquare,
  Award,
} from "lucide-react"
import { findUserById } from "@/lib/storage"
import { formatProfileScore, getProfileMetrics, getProfileScoreLabel, formatLastActive } from "@/lib/profile-scoring"
import { getAllPublishedTasks } from "@/lib/task-management"
import { formatPrice } from "@/lib/constants"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ReviewDisplay } from "@/components/review-display"
import Link from "next/link"
import { CardDescription } from "@/components/ui/card"

export default function PublicProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [profileUrl, setProfileUrl] = useState("")
  const [userReviews, setUserReviews] = useState<any[]>([])

  useEffect(() => {
    // Set the profile URL for sharing
    if (typeof window !== "undefined") {
      setProfileUrl(`${window.location.origin}/profile/${id}`)
    }

    const loadUser = () => {
      const userData = findUserById(id as string)
      if (userData) {
        setUser(userData)

        // Check if this is the current user's own profile
        setIsOwnProfile(currentUser?.id === userData.id)

        // Get or calculate fresh profile metrics
        const profileMetrics = getProfileMetrics(userData.id, userData.userType)
        setMetrics(profileMetrics)

        // Get recent tasks
        const allTasks = getAllPublishedTasks()
        if (userData.userType === "student") {
          // Get tasks assigned to this student
          const studentTasks = allTasks
            .filter((task) => task.assigneeId === userData.id)
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 5)
          setRecentTasks(studentTasks)

          // Get reviews for this student
          const studentReviews = allTasks
            .filter(
              (task) =>
                task.status === "completed" && task.assignment?.studentId === userData.id && task.employerReview,
            )
            .map((task) => task.employerReview)
            .sort((a, b) => b.createdAt - a.createdAt)
          setUserReviews(studentReviews)
        } else {
          // Get tasks posted by this employer
          const employerTasks = allTasks
            .filter((task) => task.ownerId === userData.id)
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 5)
          setRecentTasks(employerTasks)

          // Get reviews for this employer
          const employerReviews = allTasks
            .filter((task) => task.status === "completed" && task.ownerId === userData.id && task.studentReview)
            .map((task) => task.studentReview)
            .sort((a, b) => b.createdAt - a.createdAt)
          setUserReviews(employerReviews)
        }
      } else {
        // User not found, redirect to home
        router.push("/")
      }
      setIsLoading(false)
    }

    loadUser()
  }, [id, router, currentUser])

  const copyProfileUrl = () => {
    navigator.clipboard.writeText(profileUrl)
    toast({
      title: "Link copied!",
      description: "Profile link copied to clipboard",
    })
  }

  const shareProfile = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${user.fullName}'s Profile`,
          url: profileUrl,
        })
        .catch((error) => {
          // Fallback to copy if share fails
          copyProfileUrl()
        })
    } else {
      // Fallback for browsers that don't support Web Share API
      copyProfileUrl()
    }
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>

        <div className="flex flex-col items-center mb-6">
          <Skeleton className="h-24 w-24 rounded-full mb-4" />
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </div>

        <Skeleton className="h-10 w-full mb-6" />

        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <Button onClick={() => router.push("/")}>Go to Home</Button>
      </div>
    )
  }

  const isStudent = user.userType === "student"
  const profileScore = metrics?.profileScore || 0
  const scoreLabel = getProfileScoreLabel(profileScore)

  return (
    <div className="container py-6 pb-20 px-4 sm:px-6">
      {/* Back button and title - simplified for mobile */}
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" className="mr-2 p-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-lg font-bold">{isStudent ? "Student Profile" : "Employer Profile"}</h1>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center mb-6">
        <Avatar className="h-20 w-20 mb-3">
          <AvatarImage src={isStudent ? user.profile?.profilePicture : user.profile?.companyLogo} alt={user.fullName} />
          <AvatarFallback className="text-xl">{user.fullName.charAt(0)}</AvatarFallback>
        </Avatar>

        <h2 className="text-xl font-bold mb-1 text-center">{user.fullName}</h2>

        <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
          <Badge variant="outline" className="font-normal">
            {isStudent ? "Student" : "Employer"}
          </Badge>

          {user.lastActiveDate && (
            <Badge variant="outline" className="font-normal">
              <Clock className="h-3 w-3 mr-1" />
              Active {formatLastActive(user.lastActiveDate)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center">
            <div className="relative h-12 w-12">
              <Progress
                value={profileScore}
                className="h-12 w-12 rounded-full"
                indicatorClassName={`bg-${profileScore >= 70 ? "green" : profileScore >= 50 ? "yellow" : "red"}-500`}
              />
              <div className="absolute inset-0 flex items-center justify-center font-bold">
                {formatProfileScore(profileScore)}
              </div>
            </div>
            <div className="ml-2">
              <div className="text-sm font-medium">{scoreLabel}</div>
              <div className="text-xs text-muted-foreground">Profile Score</div>
            </div>
          </div>

          {metrics?.averageRating > 0 && (
            <div className="flex items-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(metrics.averageRating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="ml-1 text-sm">{metrics.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Share profile buttons - moved below profile score and centered */}
        <div className="flex items-center justify-center gap-2 w-full mb-4">
          <Button variant="outline" size="sm" onClick={copyProfileUrl} className="flex-1 max-w-[120px]">
            <Copy className="h-4 w-4 mr-1" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={shareProfile} className="flex-1 max-w-[120px]">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Registration nudge for non-logged in users */}
      {!currentUser && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-between gap-4">
              <div className="text-center mb-2">
                <h3 className="font-medium text-lg mb-1">
                  {isStudent ? "Looking for talented students like this?" : "Want to work with this employer?"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isStudent
                    ? "Join our platform to connect with skilled students ready to tackle your projects."
                    : "Join our platform to apply for opportunities from employers like this one."}
                </p>
              </div>
              <Button
                onClick={() => router.push(isStudent ? "/register/employer" : "/register/student")}
                className="w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Register as {isStudent ? "Employer" : "Student"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs sm:text-sm">
            Stats
          </TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs sm:text-sm">
            Reviews {userReviews.length > 0 ? `(${userReviews.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs sm:text-sm">
            Info
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Bio/Description */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">{isStudent ? "Bio" : "Company Description"}</h3>
              <p className="text-sm text-muted-foreground">
                {isStudent
                  ? user.profile?.bio || "No bio provided"
                  : user.profile?.companyDescription || "No company description provided"}
              </p>

              {/* External links */}
              {((isStudent && (user.profile?.portfolioUrl || user.profile?.linkedinUrl)) ||
                (!isStudent && (user.profile?.websiteUrl || user.profile?.socialMediaLinks?.linkedin))) && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {isStudent && user.profile?.portfolioUrl && (
                      <a
                        href={user.profile.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-primary hover:underline"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Portfolio
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}

                    {isStudent && user.profile?.linkedinUrl && (
                      <a
                        href={user.profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-primary hover:underline"
                      >
                        <Linkedin className="h-3 w-3 mr-1" />
                        LinkedIn
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}

                    {!isStudent && user.profile?.websiteUrl && (
                      <a
                        href={user.profile.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-primary hover:underline"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}

                    {!isStudent && user.profile?.socialMediaLinks?.linkedin && (
                      <a
                        href={user.profile.socialMediaLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-primary hover:underline"
                      >
                        <Linkedin className="h-3 w-3 mr-1" />
                        LinkedIn
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-4">
                {isStudent ? (
                  // Student metrics
                  <>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Completed Tasks</span>
                      <span className="text-xl font-bold">{metrics?.completedTasks || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Acceptance Rate</span>
                      <span className="text-xl font-bold">{(metrics?.acceptanceRate || 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Total Earned</span>
                      <span className="text-xl font-bold">{formatPrice(metrics?.totalEarned || 0)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Response Time</span>
                      <span className="text-xl font-bold">{Math.round(metrics?.responseTimeMinutes || 0)} min</span>
                    </div>
                  </>
                ) : (
                  // Employer metrics
                  <>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Tasks Posted</span>
                      <span className="text-xl font-bold">{metrics?.totalTasksPosted || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Tasks Completed</span>
                      <span className="text-xl font-bold">{metrics?.totalTasksCompleted || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Avg. Task Value</span>
                      <span className="text-xl font-bold">{formatPrice(metrics?.averageTaskValue || 0)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Response Time</span>
                      <span className="text-xl font-bold">{Math.round(metrics?.responseTimeMinutes || 0)} min</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{isStudent ? "Recent Tasks" : "Recent Postings"}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 cursor-pointer"
                      onClick={() => router.push(`/task/${task.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{task.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <Badge
                            variant="outline"
                            className={`${
                              task.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : task.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100"
                            }`}
                          >
                            {task.status.replace("_", " ")}
                          </Badge>
                          <span>{formatPrice(task.price || 0)}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No recent activity</div>
              )}
            </CardContent>
            {!currentUser && (
              <CardFooter className="p-4 pt-0 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(isStudent ? "/register/employer" : "/register/student")}
                >
                  {isStudent ? "Hire talented students like this" : "Find more opportunities like these"}
                </Button>
              </CardFooter>
            )}
          </Card>
          {isStudent && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Achievement Certificate</CardTitle>
                <CardDescription>Showcase your skills and completed tasks</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4">
                    <Award className="h-12 w-12 text-primary opacity-80" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your personalized certificate showcases your completed tasks, earnings, and the brands you've worked
                    with.
                  </p>
                  <Button asChild>
                    <Link href={`/certificate/${user.id}`}>
                      <Award className="mr-2 h-4 w-4" />
                      View Certificate
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Other tabs remain the same */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isStudent ? (
                // Student statistics
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Task Completion Rate</span>
                      <span className="text-sm font-medium">
                        {((metrics?.taskCompletionRate || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={(metrics?.taskCompletionRate || 0) * 100} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Applications</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Total</span>
                          <span className="text-xs font-medium">{metrics?.totalApplications || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Accepted</span>
                          <span className="text-xs font-medium">{metrics?.acceptedApplications || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Rejected</span>
                          <span className="text-xs font-medium">{metrics?.rejectedApplications || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Tasks</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Assigned</span>
                          <span className="text-xs font-medium">{metrics?.acceptedApplications || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Completed</span>
                          <span className="text-xs font-medium">{metrics?.completedTasks || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Avg. Earnings</span>
                          <span className="text-xs font-medium">
                            {metrics?.completedTasks && metrics.completedTasks > 0
                              ? formatPrice((metrics.totalEarned || 0) / metrics.completedTasks)
                              : formatPrice(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Employer statistics
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Task Completion Rate</span>
                      <span className="text-sm font-medium">
                        {((metrics?.taskCompletionRate || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={(metrics?.taskCompletionRate || 0) * 100} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Tasks</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Posted</span>
                          <span className="text-xs font-medium">{metrics?.totalTasksPosted || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">In Progress</span>
                          <span className="text-xs font-medium">{metrics?.totalTasksInProgress || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Completed</span>
                          <span className="text-xs font-medium">{metrics?.totalTasksCompleted || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Financials</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Avg. Task Value</span>
                          <span className="text-xs font-medium">{formatPrice(metrics?.averageTaskValue || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Payment Reliability</span>
                          <span className="text-xs font-medium">
                            {((metrics?.paymentReliability || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Total Spent</span>
                          <span className="text-xs font-medium">
                            {formatPrice((metrics?.totalTasksCompleted || 0) * (metrics?.averageTaskValue || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Score Breakdown */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Profile Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Task Completion
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round((metrics?.taskCompletionRate || 0) * 35)} pts
                    </span>
                  </div>
                  <Progress value={(metrics?.taskCompletionRate || 0) * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Reviews
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(((metrics?.averageRating || 0) / 5) * 25)} pts
                    </span>
                  </div>
                  <Progress value={((metrics?.averageRating || 0) / 5) * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Response Time
                    </span>
                    <span className="text-sm font-medium">
                      {(() => {
                        const responseTime = metrics?.responseTimeMinutes || 60
                        let responseScore = 0.2
                        if (responseTime <= 5) responseScore = 1.0
                        else if (responseTime <= 15) responseScore = 0.8
                        else if (responseTime <= 60) responseScore = 0.6
                        else if (responseTime <= 1440) responseScore = 0.4
                        return Math.round(responseScore * 15)
                      })()} pts
                    </span>
                  </div>
                  <Progress
                    value={(() => {
                      const responseTime = metrics?.responseTimeMinutes || 60
                      let responseScore = 0.2
                      if (responseTime <= 5) responseScore = 1.0
                      else if (responseTime <= 15) responseScore = 0.8
                      else if (responseTime <= 60) responseScore = 0.6
                      else if (responseTime <= 1440) responseScore = 0.4
                      return responseScore * 100
                    })()}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Activity Level
                    </span>
                    <span className="text-sm font-medium">
                      {(() => {
                        const lastActiveDate = metrics?.lastActiveDate || Date.now()
                        const daysSinceActive = (Date.now() - lastActiveDate) / (1000 * 60 * 60 * 24)
                        let activityScore = 1.0
                        if (daysSinceActive > 3) {
                          const decayDays = daysSinceActive - 3
                          const decayPercentage = Math.min(decayDays * 0.5, 30)
                          activityScore = 1.0 - decayPercentage / 100
                        }
                        return Math.round(activityScore * 15)
                      })()} pts
                    </span>
                  </div>
                  <Progress
                    value={(() => {
                      const lastActiveDate = metrics?.lastActiveDate || Date.now()
                      const daysSinceActive = (Date.now() - lastActiveDate) / (1000 * 60 * 60 * 24)
                      let activityScore = 1.0
                      if (daysSinceActive > 3) {
                        const decayDays = daysSinceActive - 3
                        const decayPercentage = Math.min(decayDays * 0.5, 30)
                        activityScore = 1.0 - decayPercentage / 100
                      }
                      return activityScore * 100
                    })()}
                    className="h-2"
                  />
                </div>

                {!isStudent && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Payment Reliability
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round((metrics?.paymentReliability || 1) * 10)} pts
                      </span>
                    </div>
                    <Progress value={(metrics?.paymentReliability || 1) * 100} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
            {!currentUser && (
              <CardFooter className="p-4 pt-0 border-t">
                <Button
                  className="w-full"
                  onClick={() => router.push(isStudent ? "/register/employer" : "/register/student")}
                >
                  {isStudent ? "Hire talented students" : "Apply to work with employers"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{isStudent ? "Employer Reviews" : "Student Reviews"}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {userReviews.length > 0 ? (
                <div className="space-y-4">
                  {userReviews.map((review, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <ReviewDisplay review={review} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                  <p>No reviews yet</p>
                  <p className="text-sm mt-1">Reviews will appear here after completing tasks</p>
                </div>
              )}
            </CardContent>
            {!currentUser && (
              <CardFooter className="p-4 pt-0 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(isStudent ? "/register/employer" : "/register/student")}
                >
                  {isStudent ? "Work with this student" : "Find opportunities with this employer"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          {/* Contact Information - Only shown to the profile owner */}
          {isOwnProfile && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Contact Information</CardTitle>
                <p className="text-xs text-muted-foreground">Only visible to you</p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>

                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{user.whatsappNumber}</span>
                  </div>

                  {!isStudent && user.profile?.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{user.profile.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          {isStudent ? (
            // Student additional info
            <>
              {/* Skills */}
              {user.profile?.skills && user.profile.skills.length > 0 && (
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {user.profile.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {user.profile?.education && user.profile.education.length > 0 && (
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Education</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      {user.profile.education.map((edu: any, index: number) => (
                        <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center">
                            <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                            <h4 className="font-medium text-sm">{edu.degree}</h4>
                          </div>
                          <p className="text-sm ml-6">{edu.institution}</p>
                          <p className="text-xs text-muted-foreground ml-6">
                            {edu.startYear} - {edu.endYear || "Present"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              {user.profile?.experience && user.profile.experience.length > 0 && (
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      {user.profile.experience.map((exp: any, index: number) => (
                        <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                            <h4 className="font-medium text-sm">{exp.position}</h4>
                          </div>
                          <p className="text-sm ml-6">{exp.company}</p>
                          <p className="text-xs text-muted-foreground ml-6">
                            {new Date(exp.startDate).toLocaleDateString(undefined, { year: "numeric", month: "short" })}{" "}
                            -
                            {exp.endDate
                              ? new Date(exp.endDate).toLocaleDateString(undefined, { year: "numeric", month: "short" })
                              : "Present"}
                          </p>
                          {exp.description && (
                            <p className="text-xs text-muted-foreground ml-6 mt-1">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            // Employer additional info
            <>
              {/* Company Details */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">Company Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {user.profile?.industry && (
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Industry: {user.profile.industry}</span>
                      </div>
                    )}

                    {user.profile?.companySize && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Company Size: {user.profile.companySize}</span>
                      </div>
                    )}

                    {user.profile?.foundedYear && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Founded: {user.profile.foundedYear}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              {user.profile?.socialMediaLinks &&
                Object.values(user.profile.socialMediaLinks).some((link) => !!link) && (
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">Social Media</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex flex-wrap gap-3">
                        {user.profile.socialMediaLinks.linkedin && (
                          <a
                            href={user.profile.socialMediaLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-primary hover:underline"
                          >
                            <Linkedin className="h-4 w-4 mr-1" />
                            LinkedIn
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}

                        {user.profile.socialMediaLinks.twitter && (
                          <a
                            href={user.profile.socialMediaLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-primary hover:underline"
                          >
                            <Twitter className="h-4 w-4 mr-1" />
                            Twitter
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}

                        {user.profile.socialMediaLinks.facebook && (
                          <a
                            href={user.profile.socialMediaLinks.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-primary hover:underline"
                          >
                            <Facebook className="h-4 w-4 mr-1" />
                            Facebook
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
            </>
          )}

          {!currentUser && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="font-medium text-lg mb-2">
                    {isStudent ? "Want to connect with this student?" : "Interested in working with this employer?"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isStudent
                      ? "Join our platform to access a pool of talented students ready to work on your projects."
                      : "Join our platform to apply for opportunities and grow your portfolio."}
                  </p>
                  <Button onClick={() => router.push(isStudent ? "/register/employer" : "/register/student")}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register as {isStudent ? "Employer" : "Student"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
/* END_LOCKED_SECTION: public-profile */
