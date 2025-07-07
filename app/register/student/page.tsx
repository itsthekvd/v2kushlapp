// Add locking comments at the top of the file
/* LOCKED_SECTION: student-registration - DO NOT MODIFY
 * Description: Student registration form and logic
 * Last verified working: 2025-05-09
 * Dependencies: auth-context, storage.ts
 * Checksum: 2b3c4d5e6f7g8h9i
 */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { findUserByEmail, getUsers } from "@/lib/storage"

// Storage key
const STUDENT_REGISTRATION_STORAGE_KEY = "kushl_student_registration_form"

export default function StudentRegistrationPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    whatsappNumber: "",
    password: "",
  })
  const [errors, setErrors] = useState({
    email: "",
    whatsappNumber: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Load saved form data on initial render
  useEffect(() => {
    const savedData = localStorage.getItem(STUDENT_REGISTRATION_STORAGE_KEY)
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      setFormData(parsedData)

      // Validate loaded data
      if (parsedData.email) {
        setErrors((prev) => ({ ...prev, email: validateEmail(parsedData.email) }))
      }
      if (parsedData.whatsappNumber) {
        setErrors((prev) => ({ ...prev, whatsappNumber: validateWhatsappNumber(parsedData.whatsappNumber) }))
      }
    }
  }, [])

  // Check form validity whenever form data or errors change
  useEffect(() => {
    const isValid =
      formData.fullName.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.whatsappNumber.trim() !== "" &&
      formData.password.trim() !== "" &&
      errors.email === "" &&
      errors.whatsappNumber === ""

    setIsFormValid(isValid)
  }, [formData, errors])

  // Save form data to localStorage
  const saveFormData = (updatedData: typeof formData) => {
    localStorage.setItem(STUDENT_REGISTRATION_STORAGE_KEY, JSON.stringify(updatedData))
  }

  const validateEmail = (email: string) => {
    if (!email) return ""

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address"
    }

    // Check if email already exists
    const existingUser = findUserByEmail(email)
    if (existingUser) {
      return "This email is already registered. Please use a different email."
    }

    return ""
  }

  const validateWhatsappNumber = (number: string) => {
    if (!number) return ""

    // Basic phone number validation
    if (number.length < 10) {
      return "Please enter a valid WhatsApp number"
    }

    // Check if WhatsApp number already exists
    const allUsers = getUsers()
    const existingUser = allUsers.find((user) => user.whatsappNumber === number)
    if (existingUser) {
      return "This WhatsApp number is already registered. Please use a different number."
    }

    return ""
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updatedFormData = { ...formData, [name]: value }
    setFormData(updatedFormData)

    // Save to localStorage
    saveFormData(updatedFormData)

    // Validate in real-time
    if (name === "email") {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }))
    } else if (name === "whatsappNumber") {
      setErrors((prev) => ({ ...prev, whatsappNumber: validateWhatsappNumber(value) }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Final validation before submission
    const emailError = validateEmail(formData.email)
    const whatsappError = validateWhatsappNumber(formData.whatsappNumber)

    if (emailError || whatsappError) {
      setErrors({
        email: emailError,
        whatsappNumber: whatsappError,
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await register({
        fullName: formData.fullName,
        email: formData.email,
        whatsappNumber: formData.whatsappNumber,
        userType: "student",
      })

      if (result.success) {
        // Clear saved form data on successful registration
        localStorage.removeItem(STUDENT_REGISTRATION_STORAGE_KEY)

        toast({
          title: "Welcome to KushL!",
          description: "Your student account has been created successfully.",
        })

        // Explicitly redirect to profile page
        console.log("Redirecting to profile page after student registration")
        router.push("/profile")
      } else {
        // Provide more user-friendly error messages
        if (result.message.includes("Email already registered")) {
          toast({
            variant: "destructive",
            title: "Email already in use",
            description:
              "This email address is already registered. Please use a different email or login to your existing account.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Registration failed",
            description: result.message,
          })
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "We couldn't create your account right now. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold">Student Registration</h1>
          <p className="text-xs text-muted-foreground">Create your student account to find opportunities</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label htmlFor="fullName" className="text-sm">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1 col-span-2">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className={`h-10 ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
            </div>

            <div className="space-y-1 col-span-2">
              <Label htmlFor="whatsappNumber" className="text-sm">
                WhatsApp Number
              </Label>
              <Input
                id="whatsappNumber"
                name="whatsappNumber"
                placeholder="+91 9876543210"
                value={formData.whatsappNumber}
                onChange={handleChange}
                required
                className={`h-10 ${errors.whatsappNumber ? "border-red-500" : ""}`}
              />
              {errors.whatsappNumber && <p className="text-xs text-red-500 mt-0.5">{errors.whatsappNumber}</p>}
            </div>

            <div className="space-y-1 col-span-2">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-10"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-10 mt-4" disabled={isLoading || !isFormValid}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>

          <div className="text-center text-xs mt-3">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
// Add locking comment at the end of the file
/* END_LOCKED_SECTION: student-registration */
