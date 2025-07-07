import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Sparkles, Clock, Shield, LineChart } from "lucide-react"

export function EmployerBenefits() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <BenefitCard
        icon={<Users className="h-8 w-8 text-blue-500" />}
        title="Access Skilled Talent"
        description="Connect with pre-vetted students eager to prove themselves on real projects"
      />

      <BenefitCard
        icon={<Target className="h-8 w-8 text-red-500" />}
        title="Perfect Match"
        description="Our platform helps you find the right student with the exact skills you need"
      />

      <BenefitCard
        icon={<Sparkles className="h-8 w-8 text-amber-500" />}
        title="Fresh Perspectives"
        description="Get innovative solutions and new ideas from bright, motivated minds"
      />

      <BenefitCard
        icon={<Clock className="h-8 w-8 text-purple-500" />}
        title="Flexible Engagement"
        description="Hire for one-time projects or ongoing work based on your changing needs"
      />

      <BenefitCard
        icon={<Shield className="h-8 w-8 text-green-500" />}
        title="Quality Assurance"
        description="Our review system ensures you only pay for work that meets your standards"
      />

      <BenefitCard
        icon={<LineChart className="h-8 w-8 text-indigo-500" />}
        title="Cost Effective"
        description="Get quality work at competitive rates while helping students grow"
      />
    </div>
  )
}

interface BenefitCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="mb-2">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
