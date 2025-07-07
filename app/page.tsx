/* LOCKED_SECTION: homepage-main - DO NOT MODIFY
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
