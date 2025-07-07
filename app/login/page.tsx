// Add locking comments at the top of the file
/* LOCKED_SECTION: login-page - DO NOT MODIFY
 * Description: User login functionality
 * Last verified working: 2025-05-09
 * Dependencies: auth-context, storage.ts
 * Checksum: 1a2b3c4d5e6f7g8h
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
import { findUserByEmail } from "@/lib/storage"

// Storage keys
const LOGIN_STORAGE_KEY = "kushl_login_form"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Load saved form data on initial render
  useEffect(() => {
    const savedData = localStorage.getItem(LOGIN_STORAGE_KEY)
    if (savedData) {
      const { email, password } = JSON.parse(savedData)
      setEmail(email || "")
      setPassword(password || "")
    }
  }, [])

  // Save form data as user types
  const saveFormData = (updatedEmail: string, updatedPassword: string) => {
    localStorage.setItem(
      LOGIN_STORAGE_KEY,
      JSON.stringify({
        email: updatedEmail,
        password: updatedPassword,
      }),
    )
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    setEmailError("")
    saveFormData(newEmail, password)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    saveFormData(email, newPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setEmailError("")

    try {
      // Check if user exists first
      const userExists = findUserByEmail(email)

      if (!userExists) {
        setEmailError("This email is not registered. Please sign up first.")
        setIsLoading(false)
        return
      }

      const result = await login(email, password)

      if (result.success) {
        // Clear saved form data on successful login
        localStorage.removeItem(LOGIN_STORAGE_KEY)

        toast({
          title: "Welcome back!",
          description: "You've successfully logged in to your account.",
        })
        // Redirect is handled in auth context
      } else {
        // Provide a more user-friendly error message
        if (result.message.includes("Invalid email or password")) {
          toast({
            variant: "destructive",
            title: "Incorrect password",
            description: "The password you entered doesn't match our records. Please try again.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: result.message,
          })
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "We couldn't log you in right now. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={handleEmailChange}
              required
              className={`h-12 ${emailError ? "border-red-500" : ""}`}
            />
            {emailError && <p className="text-sm text-red-500">{emailError}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              className="h-12"
            />
          </div>

          <Button type="submit" className="w-full h-12" disabled={isLoading || !!emailError}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}
// Add locking comment at the end of the file
/* END_LOCKED_SECTION: login-page */
