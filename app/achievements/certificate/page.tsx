"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Award } from "lucide-react"
import { StudentCertificate } from "@/components/student-certificate"
import { useAuth } from "@/contexts/auth-context"

export default function StudentCertificatePage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect if not logged in or not a student
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "student") {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user || user.userType !== "student") {
    return null
  }

  return (
    <div className="container py-4 md:py-8">
      <div className="mb-4 md:mb-6">
        <Link href="/achievements" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Achievements
        </Link>
        <h1 className="text-xl md:text-2xl font-bold mt-2 md:mt-4">Your Achievement Certificate</h1>
        <p className="text-sm md:text-base text-gray-600">
          This certificate showcases your skills and achievements on the KushL platform. Share it with potential
          employers or on your social media profiles.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex items-start gap-3 md:gap-4">
          <Award className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
          <div>
            <h2 className="font-semibold text-gray-800 text-sm md:text-base">Why Your Certificate Matters</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Your KushL certificate is a verified record of your work history, skills, and earnings on our platform. It
              helps you build credibility with employers and showcases your professional achievements.
            </p>
          </div>
        </div>
      </div>

      <StudentCertificate studentId={user.id} />

      <div className="mt-6 md:mt-8 border-t pt-4 md:pt-6">
        <h2 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">How to Use Your Certificate</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="border rounded-md p-3 md:p-4">
            <h3 className="font-medium text-gray-700 mb-1 md:mb-2 text-sm md:text-base">Share on Social Media</h3>
            <p className="text-xs md:text-sm text-gray-600">
              Download your certificate and share it on LinkedIn, Twitter, or other platforms to showcase your skills.
            </p>
          </div>
          <div className="border rounded-md p-3 md:p-4">
            <h3 className="font-medium text-gray-700 mb-1 md:mb-2 text-sm md:text-base">Add to Your Portfolio</h3>
            <p className="text-xs md:text-sm text-gray-600">
              Include your certificate URL in your portfolio or resume to provide verifiable proof of your work.
            </p>
          </div>
          <div className="border rounded-md p-3 md:p-4">
            <h3 className="font-medium text-gray-700 mb-1 md:mb-2 text-sm md:text-base">Send to Employers</h3>
            <p className="text-xs md:text-sm text-gray-600">
              Share your certificate directly with potential employers to demonstrate your experience and skills.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
