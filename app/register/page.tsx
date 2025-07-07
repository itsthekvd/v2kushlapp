/* LOCKED_SECTION: register-selection - DO NOT MODIFY
 * Description: User type selection for registration
 * Last verified working: 2025-05-09
 * Dependencies: auth-context
 * Checksum: 9i8h7g6f5e4d3c2b
 */
"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { User, Briefcase } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleUserTypeSelection = (userType: "student" | "employer") => {
    router.push(`/register/${userType}`)
  }

  return (
    <div className="container flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-sm text-muted-foreground">Choose your account type to get started</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 justify-center items-center"
            onClick={() => handleUserTypeSelection("student")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">Student</div>
              <div className="text-xs text-muted-foreground">Find opportunities</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 justify-center items-center"
            onClick={() => handleUserTypeSelection("employer")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">Employer</div>
              <div className="text-xs text-muted-foreground">Post opportunities</div>
            </div>
          </Button>
        </div>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}
/* END_LOCKED_SECTION: register-selection */
