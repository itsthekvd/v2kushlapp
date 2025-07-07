"use client"

import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Share2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMobile } from "@/hooks/use-mobile"
import { getStudentCertificateData } from "@/lib/certificate-utils"
import html2canvas from "html2canvas"

interface StudentCertificateProps {
  studentId: string
  showControls?: boolean
  isPublic?: boolean
}

export function StudentCertificate({ studentId, showControls = true, isPublic = false }: StudentCertificateProps) {
  const router = useRouter()
  const certificateRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const isMobile = useMobile()
  const [certificateData, setCertificateData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCertificateData = async () => {
      try {
        setLoading(true)
        const data = await getStudentCertificateData(studentId)
        setCertificateData(data)
        setLoading(false)
      } catch (error) {
        console.error("Error loading certificate data:", error)
        setError("Failed to load certificate data")
        setLoading(false)
      }
    }

    loadCertificateData()
  }, [studentId])

  const handleDownload = async () => {
    if (!certificateRef.current) return

    try {
      setIsDownloading(true)

      // Use html2canvas to capture the certificate as an image
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // Higher scale for better quality
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      })

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return

        // Create download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `kushl-certificate-${certificateData?.student?.fullName || "student"}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setIsDownloading(false)
      }, "image/png")
    } catch (error) {
      console.error("Error downloading certificate:", error)
      setIsDownloading(false)
    }
  }

  const handleShare = () => {
    if (typeof window === "undefined") return

    const url = `${window.location.origin}/certificate/${studentId}`

    if (navigator.share) {
      navigator
        .share({
          title: `${certificateData?.student?.fullName || "Student"}'s KushL Certificate`,
          text: "Check out my achievement certificate from KushL",
          url,
        })
        .catch((error) => {
          console.error("Error sharing:", error)
          // Fallback to copying to clipboard
          copyToClipboard(url)
        })
    } else {
      // Fallback for browsers that don't support the Web Share API
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Certificate link copied to clipboard!"))
      .catch((err) => console.error("Failed to copy:", err))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error || !certificateData) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error || "Failed to load certificate data"}</p>
      </div>
    )
  }

  const { student, completedTasks, categories, employers, totalEarnings, successRate, certificateId, issueDate } =
    certificateData
  const verificationUrl = `https://kushl.app/certificate/${certificateId}`

  return (
    <div className="flex flex-col items-center w-full">
      {showControls && (
        <div className="flex justify-end w-full mb-4 gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? "Processing..." : "Download Certificate"}
          </Button>
        </div>
      )}

      {/* Certificate Container - Scale down for mobile but keep exact same layout */}
      <div className="w-full flex justify-center">
        <div
          className="w-full max-w-[800px] transform-gpu"
          style={{
            transform: isMobile ? "scale(0.65)" : "none",
            transformOrigin: "top center",
            marginBottom: isMobile ? "-30%" : "0",
          }}
        >
          <div
            ref={certificateRef}
            className="bg-white border rounded-lg shadow-sm w-full"
            style={{
              aspectRatio: "1.414/1", // Approximate A4 aspect ratio
            }}
          >
            <div className="p-8 flex flex-col h-full">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Certificate of Achievement</h1>
                <p className="text-gray-600 mt-2">This certifies that</p>
                <h2 className="text-2xl font-bold mt-2 text-primary">{student.fullName}</h2>
                <p className="text-gray-500 text-sm">{student.email}</p>
              </div>

              <p className="text-center text-gray-700 mb-6">
                has successfully completed {completedTasks.length} task{completedTasks.length !== 1 ? "s" : ""} with a
                success rate of {successRate.toFixed(1)}% and earned a total of ₹{totalEarnings.toLocaleString()}{" "}
                through the KushL platform.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-6 flex-grow">
                <div className="border rounded-md p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Projects Delivered In</h3>
                  <div className="space-y-2">
                    {Object.entries(categories).length > 0 ? (
                      Object.entries(categories).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-gray-700">{category}</span>
                          <span className="text-gray-500 text-sm">
                            {count} task{count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No categories found</p>
                    )}
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Brands Worked With</h3>
                  <div className="flex flex-wrap gap-2">
                    {employers.length > 0 ? (
                      employers.map((employer) => (
                        <div key={employer.id} className="flex items-center border rounded-md p-2 bg-gray-50">
                          {employer.profile?.companyLogo ? (
                            <div className="h-10 w-10 relative">
                              <Image
                                src={employer.profile.companyLogo || "/placeholder.svg"}
                                alt={employer.fullName || employer.name || "Employer"}
                                fill
                                className="object-contain rounded-sm"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded-sm flex items-center justify-center">
                              <span className="text-xs font-bold">
                                {(employer.fullName || employer.name || "E").charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No employers found</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="text-gray-600 text-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p>Issued on: {issueDate}</p>
                      <p className="mt-1">
                        Verify at:{" "}
                        <a
                          href={verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {verificationUrl}
                        </a>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Facilitated by KushL.app</p>
                      <p className="text-xs text-gray-500">Certificate ID: {certificateId}</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="text-xs text-gray-500 text-center">
                  This certificate verifies the completion of tasks through the KushL platform.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
