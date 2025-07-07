import { EmployerAvatar } from "@/components/employer-avatar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

interface EmployerCardProps {
  employerId: string
  title: string
  description: string
}

export function EmployerCard({ employerId, title, description }: EmployerCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <EmployerAvatar employerId={employerId} size="md" />
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4">
        <p className="text-sm">View more details about this employer</p>
      </CardFooter>
    </Card>
  )
}
