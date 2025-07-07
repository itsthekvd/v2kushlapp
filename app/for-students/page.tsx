import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ForStudentsPage() {
  return (
    <div className="container py-12">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">For Students</h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Find opportunities that match your skills and interests
        </p>
        <Link href="/register/student">
          <Button size="lg">Register as Student</Button>
        </Link>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Find Opportunities</h3>
          <p className="mt-2 text-muted-foreground">Browse through a wide range of opportunities posted by employers</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Build Your Profile</h3>
          <p className="mt-2 text-muted-foreground">
            Create a comprehensive profile to showcase your skills and experience
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Get Paid</h3>
          <p className="mt-2 text-muted-foreground">Receive payments directly to your bank account or UPI</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Gain Experience</h3>
          <p className="mt-2 text-muted-foreground">Work on real-world projects and build your portfolio</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Connect with Employers</h3>
          <p className="mt-2 text-muted-foreground">
            Network with potential employers and build professional relationships
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Learn and Grow</h3>
          <p className="mt-2 text-muted-foreground">
            Develop new skills and expand your knowledge through practical experience
          </p>
        </div>
      </div>
    </div>
  )
}
