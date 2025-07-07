"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, User, CreditCard, ImageIcon, FileCheck } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentProfileForm } from "@/components/student-profile-form"
import { EmployerProfileForm } from "@/components/employer-profile-form"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")

  useEffect(() => {
    // Only redirect if explicitly not logged in (not during loading)
    if (!isLoading && !user) {
      router.push("/login?redirect=/profile")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="container py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full max-w-md mb-6" />
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-10 w-full mb-6" />
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-4" />
              ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // If not authenticated, show locked message
  if (!user) {
    return (
      <div className="container py-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Lock className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-bold text-amber-800 mb-2">Profile Settings Locked</h2>
            <p className="text-amber-700 mb-4">You need to be logged in to access profile settings.</p>
            <Button onClick={() => router.push("/login?redirect=/profile")}>Login to Access</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render the profile form based on user type
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-2">Profile Settings</h1>
      <p className="text-muted-foreground mb-6">Complete your profile to access all features</p>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            <div className="text-sm text-muted-foreground">
              {user.isProfileComplete ? (
                <span className="text-green-600 font-medium">Complete</span>
              ) : (
                <span className="text-amber-600 font-medium">Incomplete</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payment</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Compliance</span>
              </TabsTrigger>
            </TabsList>

            {user.userType === "student" ? (
              <StudentProfileForm activeTab={activeTab} setActiveTab={setActiveTab} />
            ) : (
              <EmployerProfileForm activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
