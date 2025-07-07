/* LOCKED_SECTION: employer-profile-form - DO NOT MODIFY
 * Description: Employer profile editing form
 * Last verified working: 2025-05-09
 * Dependencies: auth-context, storage.ts, default-project.ts
 * Checksum: 2b3c4d5e6f7g8h9i
 */
"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { EmployerProfile } from "@/lib/storage"
import { useRouter } from "next/navigation"

interface EmployerProfileFormProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function EmployerProfileForm({ activeTab, setActiveTab }: EmployerProfileFormProps) {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const employerUser = user as EmployerProfile

  // Basic Info State
  const [basicInfo, setBasicInfo] = useState({
    fullName: employerUser.fullName || "",
    email: employerUser.email || "",
    whatsappNumber: employerUser.whatsappNumber || "",
  })

  // Payment Details State
  const [paymentDetails, setPaymentDetails] = useState({
    bankAccountName: employerUser.payment?.bankAccountName || "",
    bankName: employerUser.payment?.bankName || "",
    accountType: employerUser.payment?.accountType || "current",
    accountNumber: employerUser.payment?.accountNumber || "",
    ifscCode: employerUser.payment?.ifscCode || "",
    upiId: employerUser.payment?.upiId || "",
  })

  // Profile State
  const [profileDetails, setProfileDetails] = useState({
    companyLogo: employerUser.profile?.companyLogo || "",
    websiteUrl: employerUser.profile?.websiteUrl || "",
    socialMediaLinks: {
      linkedin: employerUser.profile?.socialMediaLinks?.linkedin || "",
      twitter: employerUser.profile?.socialMediaLinks?.twitter || "",
      facebook: employerUser.profile?.socialMediaLinks?.facebook || "",
    },
  })

  // Compliance State
  const [complianceDetails, setComplianceDetails] = useState({
    panCard: employerUser.compliance?.panCard || "",
    aadhaarCard: employerUser.compliance?.aadhaarCard || "",
    gstNumber: employerUser.compliance?.gstNumber || "",
    udyogAadhaar: employerUser.compliance?.udyogAadhaar || "",
  })

  // Loading States
  const [isBasicInfoLoading, setIsBasicInfoLoading] = useState(false)
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isComplianceLoading, setIsComplianceLoading] = useState(false)

  // Progress to next tab
  const progressToNextTab = useCallback(() => {
    if (activeTab === "basic") {
      setActiveTab("payment")
    } else if (activeTab === "payment") {
      setActiveTab("profile")
    } else if (activeTab === "profile") {
      setActiveTab("compliance")
    } else if (activeTab === "compliance") {
      // Get the default project ID for the current user
      import("@/lib/default-project").then(({ getDefaultProjectId }) => {
        const defaultProjectId = getDefaultProjectId(employerUser.id)

        if (defaultProjectId) {
          // If a default project exists, redirect to create task under it
          router.push(`/post/project/${defaultProjectId}/create-task`)
        } else {
          // If no default project exists, create one and then redirect
          import("@/lib/default-project").then(({ createDefaultProjectForUser }) => {
            createDefaultProjectForUser(employerUser.id, employerUser.fullName || "Employer")
              .then((projectId) => {
                router.push(`/post/project/${projectId}/create-task`)
              })
              .catch((error) => {
                console.error("Error creating default project:", error)
                // Fallback to the post page if project creation fails
                router.push("/post")
              })
          })
        }
      })
    }
  }, [activeTab, setActiveTab, router, employerUser.id, employerUser.fullName])

  // Handle Basic Info Change
  const handleBasicInfoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBasicInfo((prev) => ({ ...prev, [name]: value }))
  }, [])

  // Handle Payment Details Change
  const handlePaymentDetailsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPaymentDetails((prev) => ({ ...prev, [name]: value }))
  }, [])

  // Handle Account Type Change
  const handleAccountTypeChange = useCallback((value: string) => {
    setPaymentDetails((prev) => ({
      ...prev,
      accountType: value as "savings" | "current",
    }))
  }, [])

  // Handle Profile Details Change
  const handleProfileDetailsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name.startsWith("social_")) {
      const socialNetwork = name.split("_")[1]
      setProfileDetails((prev) => ({
        ...prev,
        socialMediaLinks: {
          ...prev.socialMediaLinks,
          [socialNetwork]: value,
        },
      }))
    } else {
      setProfileDetails((prev) => ({ ...prev, [name]: value }))
    }
  }, [])

  // Handle Compliance Details Change
  const handleComplianceDetailsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setComplianceDetails((prev) => ({ ...prev, [name]: value }))
  }, [])

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
        profile: profileDetails,
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
          description: "You'll now be redirected to create your first task.",
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
            <Label htmlFor="companyLogo">Company Logo URL</Label>
            <Input
              id="companyLogo"
              name="companyLogo"
              value={profileDetails.companyLogo}
              onChange={handleProfileDetailsChange}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">Enter a URL to your company logo</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              value={profileDetails.websiteUrl}
              onChange={handleProfileDetailsChange}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="social_linkedin">LinkedIn URL</Label>
            <Input
              id="social_linkedin"
              name="social_linkedin"
              value={profileDetails.socialMediaLinks.linkedin}
              onChange={handleProfileDetailsChange}
              placeholder="https://linkedin.com/company/example"
            />
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
          <div className="space-y-2">
            <Label htmlFor="gstNumber">GST Number</Label>
            <Input
              id="gstNumber"
              name="gstNumber"
              value={complianceDetails.gstNumber}
              onChange={handleComplianceDetailsChange}
              placeholder="22AAAAA0000A1Z5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="udyogAadhaar">Udyog Aadhaar</Label>
            <Input
              id="udyogAadhaar"
              name="udyogAadhaar"
              value={complianceDetails.udyogAadhaar}
              onChange={handleComplianceDetailsChange}
              placeholder="UDAN-XX-XX-XXXXXXX"
            />
          </div>
          <Button type="submit" disabled={isComplianceLoading}>
            {isComplianceLoading ? "Finishing..." : "Finish & Create Task"}
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
/* END_LOCKED_SECTION: employer-profile-form */
