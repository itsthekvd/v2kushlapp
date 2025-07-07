"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AddAdminPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)

  const createAdminUser = () => {
    setIsAdding(true)
    try {
      // Create admin user object
      const adminUser = {
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        fullName: "Super Admin",
        email: "admin@kushl.com",
        password: "admin123", // For testing only
        whatsappNumber: "+919876543210",
        userType: "admin",
        adminLevel: "super",
        isProfileComplete: true,
        lastActiveDate: Date.now(),
        permissions: {
          manageUsers: true,
          managePayments: true,
          viewAnalytics: true,
          manageContent: true,
          manageSettings: true,
        },
      }

      // Get existing users
      const existingUsers = localStorage.getItem("kushl_users")
      const users = existingUsers ? JSON.parse(existingUsers) : []

      // Check if admin already exists
      const existingAdminIndex = users.findIndex((u: any) => u.email === adminUser.email)
      if (existingAdminIndex !== -1) {
        // Update existing admin
        users[existingAdminIndex] = adminUser
      } else {
        // Add new admin
        users.push(adminUser)
      }

      // Save to localStorage
      localStorage.setItem("kushl_users", JSON.stringify(users))

      toast({
        title: "Admin user created successfully!",
        description: "You can now login with admin@kushl.com and password admin123",
      })

      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      console.error("Error creating admin user:", error)
      toast({
        variant: "destructive",
        title: "Error creating admin user",
        description: "Please try again later",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Admin User</CardTitle>
          <CardDescription>Create a super admin user for the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <div className="font-medium">Email:</div>
              <div>admin@kushl.com</div>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <div className="font-medium">Password:</div>
              <div>admin123</div>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <div className="font-medium">Admin Level:</div>
              <div>Super Admin</div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={createAdminUser} className="w-full" disabled={isAdding}>
            {isAdding ? "Creating Admin User..." : "Create Admin User"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
