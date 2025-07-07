import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Award, DollarSign, Clock, Shield, Zap } from "lucide-react"

export function StudentBenefits() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <BenefitCard
        icon={<GraduationCap className="h-8 w-8 text-blue-500" />}
        title="Real-World Experience"
        description="Build your portfolio with actual projects from real employers"
      />

      <BenefitCard
        icon={<Award className="h-8 w-8 text-amber-500" />}
        title="Skill Certification"
        description="Earn verified certifications that showcase your abilities to future employers"
      />

      <BenefitCard
        icon={<DollarSign className="h-8 w-8 text-green-500" />}
        title="Competitive Pay"
        description="Earn money while you learn with fair compensation for your work"
      />

      <BenefitCard
        icon={<Clock className="h-8 w-8 text-purple-500" />}
        title="Flexible Schedule"
        description="Work on your own time and balance your studies with paid projects"
      />

      <BenefitCard
        icon={<Shield className="h-8 w-8 text-red-500" />}
        title="Secure Payments"
        description="Our platform ensures you get paid for completed work with payment protection"
      />

      <BenefitCard
        icon={<Zap className="h-8 w-8 text-orange-500" />}
        title="Fast Growth"
        description="Accelerate your career with direct feedback from industry professionals"
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
