/* LOCKED_SECTION: student-profile-form - DO NOT MODIFY
 * Description: Student profile editing form
 * Last verified working: 2025-05-09
 * Dependencies: auth-context, storage.ts
 * Checksum: 1a2b3c4d5e6f7g8h
 */
"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { StudentProfile } from "@/lib/storage"
import { useRouter } from "next/navigation"

// Storage keys for each tab
const STUDENT_PROFILE_STORAGE_PREFIX = "kushl_student_profile_"

interface StudentProfileFormProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function StudentProfileForm({ activeTab, setActiveTab }: StudentProfileFormProps) {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const studentUser = user as StudentProfile

  // Basic Info State
  const [basicInfo, setBasicInfo] = useState({
    fullName: studentUser.fullName || "",
    email: studentUser.email || "",
    whatsappNumber: studentUser.whatsappNumber || "",
  })

  // Payment Details State
  const [paymentDetails, setPaymentDetails] = useState({
    bankAccountName: studentUser.payment?.bankAccountName || "",
    bankName: studentUser.payment?.bankName || "",
    accountType: studentUser.payment?.accountType || "savings",
    accountNumber: studentUser.payment?.accountNumber || "",
    ifscCode: studentUser.payment?.ifscCode || "",
    upiId: studentUser.payment?.upiId || "",
  })

  // Profile State
  const [profileDetails, setProfileDetails] = useState({
    profilePicture: studentUser.profile?.profilePicture || "",
    portfolioUrl: studentUser.profile?.portfolioUrl || "",
    linkedinUrl: studentUser.profile?.linkedinUrl || "",
  })

  // Compliance State
  const [complianceDetails, setComplianceDetails] = useState({
    panCard: studentUser.compliance?.panCard || "",
    aadhaarCard: studentUser.compliance?.aadhaarCard || "",
  })

  // Loading States
  const [isBasicInfoLoading, setIsBasicInfoLoading] = useState(false)
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isComplianceLoading, setIsComplianceLoading] = useState(false)

  // Load saved form data on initial render for each tab
  useEffect(() => {
    // Load basic info
    const savedBasicInfo = localStorage.getItem(`${STUDENT_PROFILE_STORAGE_PREFIX}basic`)
    if (savedBasicInfo) {
      setBasicInfo(JSON.parse(savedBasicInfo))
    }

    // Load payment details
    const savedPaymentDetails = localStorage.getItem(`${STUDENT_PROFILE_STORAGE_PREFIX}payment`)
    if (savedPaymentDetails) {
      setPaymentDetails(JSON.parse(savedPaymentDetails))
    }

    // Load profile details
    const savedProfileDetails = localStorage.getItem(`${STUDENT_PROFILE_STORAGE_PREFIX}profile`)
    if (savedProfileDetails) {
      setProfileDetails(JSON.parse(savedProfileDetails))
    }

    // Load compliance details
    const savedComplianceDetails = localStorage.getItem(`${STUDENT_PROFILE_STORAGE_PREFIX}compliance`)
    if (savedComplianceDetails) {
      setComplianceDetails(JSON.parse(savedComplianceDetails))
    }
  }, [])

  // Progress to next tab
  const progressToNextTab = useCallback(() => {
    if (activeTab === "basic") {
      setActiveTab("payment")
    } else if (activeTab === "payment") {
      setActiveTab("profile")
    } else if (activeTab === "profile") {
      setActiveTab("compliance")
    } else if (activeTab === "compliance") {
      // Clear all saved form data when profile is complete
      localStorage.removeItem(`${STUDENT_PROFILE_STORAGE_PREFIX}basic`)
      localStorage.removeItem(`${STUDENT_PROFILE_STORAGE_PREFIX}payment`)
      localStorage.removeItem(`${STUDENT_PROFILE_STORAGE_PREFIX}profile`)
      localStorage.removeItem(`${STUDENT_PROFILE_STORAGE_PREFIX}compliance`)

      // Redirect to explore page for students after completing all sections
      router.push("/explore")
    }
  }, [activeTab, setActiveTab, router])

  // Handle Basic Info Change
  const handleBasicInfoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      const updatedBasicInfo = { ...basicInfo, [name]: value }
      setBasicInfo(updatedBasicInfo)

      // Save to localStorage
      localStorage.setItem(`${STUDENT_PROFILE_STORAGE_PREFIX}basic`, JSON.stringify(updatedBasicInfo))
    },
    [basicInfo],
  )

  // Handle Payment Details Change
  const handlePaymentDetailsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      const updatedPaymentDetails = { ...paymentDetails, [name]: value }
      setPaymentDetails(updatedPaymentDetails)

      // Save to localStorage
      localStorage.setItem(`${STUDENT_PROFILE_STORAGE_PREFIX}payment`, JSON.stringify(updatedPaymentDetails))
    },
    [paymentDetails],
  )

  // Handle Account Type Change
  const handleAccountTypeChange = useCallback(
    (value: string) => {
      const updatedPaymentDetails = {
        ...paymentDetails,
        accountType: value as "savings" | "current",
      }
      setPaymentDetails(updatedPaymentDetails)

      // Save to localStorage
      localStorage.setItem(`${STUDENT_PROFILE_STORAGE_PREFIX}payment`, JSON.stringify(updatedPaymentDetails))
    },
    [paymentDetails],
  )

  // Handle Profile Details Change
  const handleProfileDetailsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      const updatedProfileDetails = { ...profileDetails, [name]: value }
      setProfileDetails(updatedProfileDetails)

      // Save to localStorage
      localStorage.setItem(`${STUDENT_PROFILE_STORAGE_PREFIX}profile`, JSON.stringify(updatedProfileDetails))
    },
    [profileDetails],
  )

  // Handle Compliance Details Change
  const handleComplianceDetailsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      const updatedComplianceDetails = { ...complianceDetails, [name]: value }
      setComplianceDetails(updatedComplianceDetails)

      // Save to localStorage
      localStorage.setItem(`${STUDENT_PROFILE_STORAGE_PREFIX}compliance`, JSON.stringify(updatedComplianceDetails))
    },
    [complianceDetails],
  )

  // Submit Basic Info
  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsBasicInfoLoading(true)

    try {
      const result = await updateProfile(basicInfo)

      if (result.success) {
        toast({
          title: "Basic info updated",
          description: "Your basic information has been updated successfully.",
        })
        progressToNextTab()
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: result.message,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsBasicInfoLoading(false)
    }
  }

  // Submit Payment Details
  const handlePaymentDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPaymentLoading(true)

    try {
      const result = await updateProfile({
        payment: paymentDetails,
      })

      if (result.success) {
        toast({
          title: "Payment details updated",
          description: "Your payment information has been updated successfully.",
        })
        progressToNextTab()
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: result.message,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsPaymentLoading(false)
    }
  }

  // Submit Profile Details
  const handleProfileDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProfileLoading(true)

    try {
      const result = await updateProfile({
        profile: {
          profilePicture: profileDetails.profilePicture,
          portfolioUrl: profileDetails.portfolioUrl,
          linkedinUrl: "", // We're not using this field anymore
        },
      })

      if (result.success) {
        toast({
          title: "Profile details updated",
          description: "Your profile information has been updated successfully.",
        })
        progressToNextTab()
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: result.message,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsProfileLoading(false)
    }
  }

  // Submit Compliance Details
  const handleComplianceDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsComplianceLoading(true)

    try {
      const result = await updateProfile({
        compliance: complianceDetails,
      })

      if (result.success) {
        toast({
          title: "Compliance details updated",
          description: "Your compliance information has been updated successfully.",
        })
        toast({
          title: "Profile completed!",
          description: "You'll now be redirected to explore opportunities.",
        })
        progressToNextTab()
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: result.message,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsComplianceLoading(false)
    }
  }

  // Render the appropriate form based on the active tab
  if (activeTab === "basic") {
    return (
      <form onSubmit={handleBasicInfoSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" value={basicInfo.fullName} onChange={handleBasicInfoChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={basicInfo.email}
              onChange={handleBasicInfoChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              name="whatsappNumber"
              value={basicInfo.whatsappNumber}
              onChange={handleBasicInfoChange}
              required
            />
          </div>
          <Button type="submit" disabled={isBasicInfoLoading}>
            {isBasicInfoLoading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    )
  }

  if (activeTab === "payment") {
    return (
      <form onSubmit={handlePaymentDetailsSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankAccountName">Account Holder's Name (as registered with bank)</Label>
            <Input
              id="bankAccountName"
              name="bankAccountName"
              value={paymentDetails.bankAccountName}
              onChange={handlePaymentDetailsChange}
              required
            />
            <p className="text-xs text-muted-foreground">Enter the exact name registered with your bank account</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              name="bankName"
              value={paymentDetails.bankName}
              onChange={handlePaymentDetailsChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select value={paymentDetails.accountType} onValueChange={handleAccountTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="current">Current</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              name="accountNumber"
              value={paymentDetails.accountNumber}
              onChange={handlePaymentDetailsChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ifscCode">IFSC Code</Label>
            <Input
              id="ifscCode"
              name="ifscCode"
              value={paymentDetails.ifscCode}
              onChange={handlePaymentDetailsChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              name="upiId"
              value={paymentDetails.upiId}
              onChange={handlePaymentDetailsChange}
              required
            />
          </div>
          <Button type="submit" disabled={isPaymentLoading}>
            {isPaymentLoading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    )
  }

  if (activeTab === "profile") {
    return (
      <form onSubmit={handleProfileDetailsSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profilePicture">Profile Picture URL</Label>
            <Input
              id="profilePicture"
              name="profilePicture"
              value={profileDetails.profilePicture}
              onChange={handleProfileDetailsChange}
              placeholder="https://example.com/profile.jpg"
            />
            <p className="text-xs text-muted-foreground">Enter a URL to your profile picture</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolioUrl">Profile URL</Label>
            <Input
              id="portfolioUrl"
              name="portfolioUrl"
              value={profileDetails.portfolioUrl}
              onChange={handleProfileDetailsChange}
              placeholder="https://myportfolio.com or https://linkedin.com/in/username"
            />
            <p className="text-xs text-muted-foreground">Enter your portfolio website URL or LinkedIn profile URL</p>
          </div>
          <Button type="submit" disabled={isProfileLoading}>
            {isProfileLoading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    )
  }

  if (activeTab === "compliance") {
    return (
      <form onSubmit={handleComplianceDetailsSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="panCard">PAN Card Number</Label>
            <Input
              id="panCard"
              name="panCard"
              value={complianceDetails.panCard}
              onChange={handleComplianceDetailsChange}
              placeholder="ABCDE1234F"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aadhaarCard">Aadhaar Card Number</Label>
            <Input
              id="aadhaarCard"
              name="aadhaarCard"
              value={complianceDetails.aadhaarCard}
              onChange={handleComplianceDetailsChange}
              placeholder="1234 5678 9012"
            />
          </div>
          <Button type="submit" disabled={isComplianceLoading}>
            {isComplianceLoading ? "Finish & Explore Opportunities" : "Finish & Explore Opportunities"}
          </Button>
        </div>
      </form>
    )
  }

  // Default fallback
  return (
    <form onSubmit={handleBasicInfoSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" name="fullName" value={basicInfo.fullName} onChange={handleBasicInfoChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={basicInfo.email}
            onChange={handleBasicInfoChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
          <Input
            id="whatsappNumber"
            name="whatsappNumber"
            value={basicInfo.whatsappNumber}
            onChange={handleBasicInfoChange}
            required
          />
        </div>
        <Button type="submit" disabled={isBasicInfoLoading}>
          {isBasicInfoLoading ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </form>
  )
}
/* END_LOCKED_SECTION: student-profile-form */
