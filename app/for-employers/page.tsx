import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ForEmployersPage() {
  return (
    <div className="container py-12">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">For Employers</h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Connect with talented students for your projects and opportunities
        </p>
        <Link href="/register/employer">
          <Button size="lg">Register as Employer</Button>
        </Link>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Post Opportunities</h3>
          <p className="mt-2 text-muted-foreground">Create and post opportunities for students to apply</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Find Talent</h3>
          <p className="mt-2 text-muted-foreground">
            Browse through student profiles to find the right talent for your projects
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Manage Projects</h3>
          <p className="mt-2 text-muted-foreground">Track progress and manage your projects efficiently</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Secure Payments</h3>
          <p className="mt-2 text-muted-foreground">Make secure payments to students through the platform</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Build Your Brand</h3>
          <p className="mt-2 text-muted-foreground">
            Create a company profile to showcase your brand and opportunities
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-xl font-bold">Get Support</h3>
          <p className="mt-2 text-muted-foreground">Receive support from our team throughout the hiring process</p>
        </div>
      </div>
    </div>
  )
}
