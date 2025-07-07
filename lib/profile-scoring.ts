// Profile scoring utility for KushL app

import { getAllPublishedTasks } from "./task-management"
import { getCurrentUser, updateUser } from "./storage"

// Constants for profile score calculation
const WEIGHTS = {
  TASK_COMPLETION_RATE: 0.35, // 35% weight for task completion rate
  REVIEW_RATING: 0.25, // 25% weight for review ratings
  RESPONSE_TIME: 0.15, // 15% weight for response time
  ACTIVITY_LEVEL: 0.15, // 15% weight for activity level (login frequency)
  PAYMENT_RELIABILITY: 0.1, // 10% weight for payment reliability (employers only)
}

// Activity decay constants
const ACTIVITY_DECAY = {
  DAYS_BEFORE_DECAY: 3, // Start decaying after 3 days of inactivity
  DAILY_DECAY_PERCENTAGE: 0.5, // Decay 0.5% per day of inactivity
  MAX_DECAY_PERCENTAGE: 30, // Maximum decay is 30% of the score
  RECOVERY_MULTIPLIER: 2, // Recover at 2x the decay rate when active again
}

// Interface for profile metrics
export interface ProfileMetrics {
  // Common metrics
  taskCompletionRate: number
  averageRating: number
  responseTimeMinutes: number
  lastActiveDate: number
  profileScore: number

  // Student-specific metrics
  totalApplications?: number
  acceptedApplications?: number
  rejectedApplications?: number
  completedTasks?: number
  totalEarned?: number
  acceptanceRate?: number

  // Employer-specific metrics
  totalTasksPosted?: number
  totalTasksCompleted?: number
  totalTasksInProgress?: number
  averageTaskValue?: number
  paymentReliability?: number
}

/**
 * Calculate profile score based on various metrics
 */
export function calculateProfileScore(metrics: Partial<ProfileMetrics>, userType: "student" | "employer"): number {
  let score = 50 // Base score of 50 (out of 100)

  // Task completion component (0-35 points)
  if (metrics.taskCompletionRate !== undefined) {
    score += metrics.taskCompletionRate * WEIGHTS.TASK_COMPLETION_RATE * 100
  }

  // Review rating component (0-25 points)
  if (metrics.averageRating !== undefined) {
    // Convert 5-star rating to 0-1 scale
    const ratingScore = metrics.averageRating / 5
    score += ratingScore * WEIGHTS.REVIEW_RATING * 100
  }

  // Response time component (0-15 points)
  if (metrics.responseTimeMinutes !== undefined) {
    // Convert response time to a score (faster is better)
    // 0-5 min: 1.0, 5-15 min: 0.8, 15-60 min: 0.6, 1-24 hrs: 0.4, >24 hrs: 0.2
    let responseScore = 0.2
    if (metrics.responseTimeMinutes <= 5) responseScore = 1.0
    else if (metrics.responseTimeMinutes <= 15) responseScore = 0.8
    else if (metrics.responseTimeMinutes <= 60) responseScore = 0.6
    else if (metrics.responseTimeMinutes <= 1440) responseScore = 0.4 // 24 hours

    score += responseScore * WEIGHTS.RESPONSE_TIME * 100
  }

  // Activity level component (0-15 points)
  if (metrics.lastActiveDate !== undefined) {
    const daysSinceActive = (Date.now() - metrics.lastActiveDate) / (1000 * 60 * 60 * 24)

    // Calculate activity decay
    let activityScore = 1.0 // Start with full score
    if (daysSinceActive > ACTIVITY_DECAY.DAYS_BEFORE_DECAY) {
      const decayDays = daysSinceActive - ACTIVITY_DECAY.DAYS_BEFORE_DECAY
      const decayPercentage = Math.min(
        decayDays * ACTIVITY_DECAY.DAILY_DECAY_PERCENTAGE,
        ACTIVITY_DECAY.MAX_DECAY_PERCENTAGE,
      )
      activityScore = 1.0 - decayPercentage / 100
    }

    score += activityScore * WEIGHTS.ACTIVITY_LEVEL * 100
  }

  // Payment reliability component for employers (0-10 points)
  if (userType === "employer" && metrics.paymentReliability !== undefined) {
    score += metrics.paymentReliability * WEIGHTS.PAYMENT_RELIABILITY * 100
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Get profile metrics for a user
 */
export function getProfileMetrics(userId: string, userType: "student" | "employer"): ProfileMetrics {
  const allTasks = getAllPublishedTasks()

  // Initialize metrics with zeros instead of default values
  const metrics: ProfileMetrics = {
    taskCompletionRate: 0,
    averageRating: 0,
    responseTimeMinutes: 0,
    lastActiveDate: Date.now(),
    profileScore: 0,
  }

  if (userType === "student") {
    // Student-specific metrics
    const studentTasks = allTasks.filter((task) => task.assigneeId === userId)
    const applications = allTasks.flatMap((task) => (task.applications || []).filter((app) => app.studentId === userId))

    const completedTasks = studentTasks.filter((task) => task.status === "completed")
    const acceptedApplications = applications.filter((app) => app.status === "approved")
    const rejectedApplications = applications.filter((app) => app.status === "rejected")

    // Calculate metrics
    metrics.totalApplications = applications.length
    metrics.acceptedApplications = acceptedApplications.length
    metrics.rejectedApplications = rejectedApplications.length
    metrics.completedTasks = completedTasks.length
    metrics.acceptanceRate = applications.length > 0 ? (acceptedApplications.length / applications.length) * 100 : 0

    // Calculate task completion rate
    metrics.taskCompletionRate = studentTasks.length > 0 ? completedTasks.length / studentTasks.length : 0

    // Calculate total earned
    metrics.totalEarned = completedTasks.reduce((sum, task) => sum + (task.price || 0), 0)

    // Calculate average rating from employer reviews
    const reviews = completedTasks.filter((task) => task.employerReview).map((task) => task.employerReview!.rating)

    metrics.averageRating = reviews.length > 0 ? reviews.reduce((sum, rating) => sum + rating, 0) / reviews.length : 0

    // Calculate response time (from timeline messages)
    const responseTimes = studentTasks
      .filter((task) => task.timelineMessages && task.timelineMessages.length > 1)
      .flatMap((task) => {
        const messages = task.timelineMessages!
        const responsePairs = []

        for (let i = 1; i < messages.length; i++) {
          if (
            messages[i - 1].userType !== messages[i].userType &&
            messages[i].userType === "student" &&
            messages[i].userId === userId
          ) {
            // This is a response from the student to an employer message
            const responseTime = (messages[i].timestamp - messages[i - 1].timestamp) / (1000 * 60) // in minutes
            responsePairs.push(responseTime)
          }
        }

        return responsePairs
      })

    if (responseTimes.length > 0) {
      metrics.responseTimeMinutes = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    }
  } else {
    // Employer-specific metrics
    const employerTasks = allTasks.filter((task) => task.ownerId === userId)
    const completedTasks = employerTasks.filter((task) => task.status === "completed")
    const inProgressTasks = employerTasks.filter((task) => task.status === "in_progress" || task.status === "review")

    // Calculate metrics
    metrics.totalTasksPosted = employerTasks.length
    metrics.totalTasksCompleted = completedTasks.length
    metrics.totalTasksInProgress = inProgressTasks.length

    // Calculate task completion rate
    metrics.taskCompletionRate = employerTasks.length > 0 ? completedTasks.length / employerTasks.length : 0

    // Calculate average task value
    metrics.averageTaskValue =
      employerTasks.length > 0
        ? employerTasks.reduce((sum, task) => sum + (task.price || 0), 0) / employerTasks.length
        : 0

    // Calculate average rating from student reviews
    const reviews = completedTasks.filter((task) => task.studentReview).map((task) => task.studentReview!.rating)

    metrics.averageRating = reviews.length > 0 ? reviews.reduce((sum, rating) => sum + rating, 0) / reviews.length : 0

    // Calculate payment reliability (percentage of completed tasks that were paid on time)
    // In a real app, you'd track payment timing
    metrics.paymentReliability = completedTasks.length > 0 ? 1.0 : 0 // Default to 100% if there are completed tasks, 0 otherwise

    // Calculate response time (from timeline messages)
    const responseTimes = employerTasks
      .filter((task) => task.timelineMessages && task.timelineMessages.length > 1)
      .flatMap((task) => {
        const messages = task.timelineMessages!
        const responsePairs = []

        for (let i = 1; i < messages.length; i++) {
          if (
            messages[i - 1].userType !== messages[i].userType &&
            messages[i].userType === "employer" &&
            messages[i].userId === userId
          ) {
            // This is a response from the employer to a student message
            const responseTime = (messages[i].timestamp - messages[i - 1].timestamp) / (1000 * 60) // in minutes
            responsePairs.push(responseTime)
          }
        }

        return responsePairs
      })

    if (responseTimes.length > 0) {
      metrics.responseTimeMinutes = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    }
  }

  // Calculate the final profile score
  metrics.profileScore = calculateProfileScore(metrics, userType)

  return metrics
}

/**
 * Update a user's last active timestamp and recalculate profile score
 */
export function updateUserActivity(userId: string): void {
  const user = getCurrentUser()
  if (user && user.id === userId) {
    // Update last active timestamp
    const updatedUser = {
      ...user,
      lastActiveDate: Date.now(),
    }

    // Recalculate profile metrics and score
    const metrics = getProfileMetrics(userId, user.userType)
    updatedUser.profileMetrics = metrics

    // Save updated user
    updateUser(updatedUser)
  }
}

/**
 * Format a profile score for display
 */
export function formatProfileScore(score: number): string {
  return score.toFixed(0)
}

/**
 * Get a descriptive label for a profile score
 */
export function getProfileScoreLabel(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Very Good"
  if (score >= 70) return "Good"
  if (score >= 60) return "Above Average"
  if (score >= 50) return "Average"
  if (score >= 40) return "Below Average"
  if (score >= 30) return "Needs Improvement"
  return "New User"
}

/**
 * Format the last active date for display
 */
export function formatLastActive(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`

  // For older dates, return the actual date
  const date = new Date(timestamp)
  return date.toLocaleDateString()
}
