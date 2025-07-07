import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraduationCap, Briefcase } from "lucide-react"

export function CTASection() {
  return (
    <div className="rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-6 text-center md:p-10">
      <h2 className="text-2xl font-bold md:text-3xl">Ready to get started?</h2>
      <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
        Join our community of students and employers to start collaborating on meaningful projects
      </p>

      <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button asChild size="lg" className="gap-2">
          <Link href="/register/student">
            <GraduationCap className="h-5 w-5" />
            Join as Student
          </Link>
        </Button>

        <Button asChild size="lg" variant="outline" className="gap-2">
          <Link href="/register/employer">
            <Briefcase className="h-5 w-5" />
            Join as Employer
          </Link>
        </Button>
      </div>
    </div>
  )
}
