"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StudentCertificate } from "@/components/student-certificate"
import { findUserById } from "@/lib/storage"

export default function CertificatePage() {
  const { id } = useParams()
  const [studentId, setStudentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateCertificate = async () => {
      try {
        setIsLoading(true)

        // The certificate ID is the student ID for consistency
        const studentId = id as string

        // Check if student exists
        const student = findUserById(studentId)
        if (!student) {
          setError("Certificate not found or invalid")
          setIsLoading(false)
          return
        }

        // If student exists, set the student ID
        setStudentId(studentId)
        setIsLoading(false)
      } catch (err) {
        console.error("Error validating certificate:", err)
        setError("An error occurred while validating the certificate")
        setIsLoading(false)
      }
    }

    validateCertificate()
  }, [id])

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error || !studentId) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Certificate Error</h1>
          <p className="text-gray-600 mb-6">{error || "Certificate not found"}</p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4 md:py-8">
      <div className="mb-4 md:mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to KushL.app
        </Link>
        <h1 className="text-xl md:text-2xl font-bold mt-2 md:mt-4">Achievement Certificate</h1>
        <p className="text-sm md:text-base text-gray-600">
          This certificate verifies the skills and achievements of a KushL student.
        </p>
      </div>

      <StudentCertificate studentId={studentId} isPublic={true} />
    </div>
  )
}
