# Locked Code Sections

This document lists all code sections that are locked and should not be modified. These sections have been verified to work correctly, and any changes could break critical functionality.

## Locked Files

| File Path | Identifier | Description | Last Verified | Dependencies |
|-----------|------------|-------------|---------------|--------------|
| app/page.tsx | homepage-main | Main homepage with student/employer join buttons | 2025-05-09 | auth-context, platform-stats, featured-tasks, benefits components |
| app/login/page.tsx | login-page | User login functionality | 2025-05-09 | auth-context, storage.ts |
| app/register/page.tsx | register-selection | User type selection for registration | 2025-05-09 | auth-context |
| app/register/student/page.tsx | student-registration | Student registration form and logic | 2025-05-09 | auth-context, storage.ts |
| app/register/employer/page.tsx | employer-registration | Employer registration form and logic | 2025-05-09 | auth-context, storage.ts |
| app/timeline/[id]/page.tsx | timeline-page | Task timeline communication functionality | 2025-05-09 | auth-context, task-management.ts |
| app/profile/[id]/page.tsx | public-profile | Public profile page for students and employers | 2025-05-09 | auth-context, profile-scoring.ts, storage.ts |
| components/student-profile-form.tsx | student-profile-form | Student profile editing form | 2025-05-09 | auth-context, storage.ts |
| components/employer-profile-form.tsx | employer-profile-form | Employer profile editing form | 2025-05-09 | auth-context, storage.ts, default-project.ts |

## How to Use

### For Developers

- Do not modify any code between `LOCKED_SECTION` and `END_LOCKED_SECTION` comments
- If changes are absolutely necessary, first "unlock" the section by removing the comments
- After making changes, verify all functionality works correctly before "locking" again
- Update the checksum and last verified date when re-locking

### For v0

- Respect all locked sections when making changes to the codebase
- Do not modify code within locked sections even when making related changes
- If a change would require modifying a locked section, notify the user and request permission

## Unlocking Process

To unlock a section for editing:
1. Remove the `LOCKED_SECTION` and `END_LOCKED_SECTION` comments
2. Make necessary changes
3. Test thoroughly
4. Add updated locking comments with new date and checksum
5. Update this documentation
\`\`\`

\`\`\`typescriptreact file="app/page.tsx"
[v0-no-op-code-block-prefix]/* LOCKED_SECTION: homepage-main - DO NOT MODIFY
 * Description: Main homepage with student/employer join buttons
 * Last verified working: 2025-05-09
 * Dependencies: auth-context, platform-stats, featured-tasks, benefits components
 * Checksum: 7f8a9b0c1d2e3f4g
 */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { PlatformStats } from "@/components/platform-stats"
import { FeaturedTasks } from "@/components/featured-tasks"
import { StudentBenefits } from "@/components/student-benefits"
import { EmployerBenefits } from "@/components/employer-benefits"
import { ReviewTestimonials } from "@/components/review-testimonials"
import { CTASection } from "@/components/cta-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, Briefcase, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Redirect logged-in users to their respective dashboards
  useEffect(() => {
    setMounted(true)
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!mounted) return null

  return (
    <div className="container space-y-12 py-8 pb-24">
      {/* Hero Section */}
      <section className="space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Connect Students with Real-World Opportunities
        </h1>
        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
          KushL bridges the gap between education and industry, helping students gain experience while providing
          employers with fresh talent and innovative solutions.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="border-2 border-primary shadow-sm">
            <Link href="/register/student" className="inline-flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Join as Student
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="border-2 shadow-sm hover:bg-accent">
            <Link href="/register/employer" className="inline-flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Join as Employer
            </Link>
          </Button>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="space-y-4">
        <h2 className="text-center text-2xl font-bold">Platform Metrics</h2>
        <PlatformStats />
      </section>

      {/* Featured Tasks */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Opportunities</h2>
          <Link href="/explore" className="flex items-center gap-1 text-sm font-medium text-primary">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <FeaturedTasks />
      </section>

      {/* Benefits Section */}
      <section className="space-y-6">
        <h2 className="text-center text-2xl font-bold">Why Choose KushL?</h2>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="students" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              For Students
            </TabsTrigger>
            <TabsTrigger value="employers" className="gap-2">
              <Briefcase className="h-4 w-4" />
              For Employers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            <StudentBenefits />
          </TabsContent>

          <TabsContent value="employers" className="mt-6">
            <EmployerBenefits />
          </TabsContent>
        </Tabs>
      </section>

      {/* Success Stories Section */}
      <section className="py-12 md:py-16">
        <div className="container space-y-16">
          <ReviewTestimonials
            reviewerType="student"
            title="What Students Are Saying"
            description="Hear from students who have completed tasks and gained valuable experience"
          />

          <ReviewTestimonials
            reviewerType="employer"
            title="What Employers Are Saying"
            description="Feedback from employers who have found talented students on our platform"
          />
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
    </div>
  )
}
/* END_LOCKED_SECTION: homepage-main */
