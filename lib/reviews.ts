import { getProjects, type Review } from "./task-management"

export interface ReviewWithTaskInfo extends Review {
  taskTitle: string
  taskId: string
}

// Get all reviews from the platform
export const getAllReviews = (): ReviewWithTaskInfo[] => {
  const projects = getProjects("all")
  const reviews: ReviewWithTaskInfo[] = []

  projects.forEach((project) => {
    project.sprints.forEach((sprint) => {
      sprint.campaigns.forEach((campaign) => {
        campaign.tasks.forEach((task) => {
          // Add employer reviews
          if (task.employerReview) {
            reviews.push({
              ...task.employerReview,
              taskTitle: task.title,
              taskId: task.id,
            })
          }

          // Add student reviews
          if (task.studentReview) {
            reviews.push({
              ...task.studentReview,
              taskTitle: task.title,
              taskId: task.id,
            })
          }
        })
      })
    })
  })

  return reviews
}

// Get the best reviews (highest rated) by reviewer type
export const getBestReviews = (
  reviewerType: "employer" | "student",
  limit = 6,
  page = 1,
): {
  reviews: ReviewWithTaskInfo[]
  totalPages: number
  currentPage: number
} => {
  const allReviews = getAllReviews()

  // Filter by reviewer type
  const filteredReviews = allReviews.filter((review) => review.reviewerType === reviewerType)

  // Sort by rating (highest first) and then by date (newest first)
  const sortedReviews = filteredReviews.sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating
    }
    return b.createdAt - a.createdAt
  })

  // Calculate pagination
  const totalReviews = sortedReviews.length
  const totalPages = Math.max(1, Math.ceil(totalReviews / limit))
  const safeCurrentPage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safeCurrentPage - 1) * limit
  const endIndex = Math.min(startIndex + limit, totalReviews)

  // Get the reviews for the current page
  const paginatedReviews = sortedReviews.slice(startIndex, endIndex)

  return {
    reviews: paginatedReviews,
    totalPages,
    currentPage: safeCurrentPage,
  }
}
