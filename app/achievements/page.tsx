"use client"

import { useGamification } from "@/contexts/gamification-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Calendar, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AchievementsPage() {
  const { points, level, streak, achievements } = useGamification()

  return (
    <div className="container space-y-6 py-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Your Achievements</h1>
        <p className="text-sm text-muted-foreground">Track your progress and earn rewards</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Achievement Certificate</CardTitle>
          <CardDescription>Your personalized certificate of accomplishment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Showcase Your Skills</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your KushL certificate displays your completed tasks, earnings, and the brands you've worked with.
              </p>
              <Button asChild>
                <Link href="/achievements/certificate">View Your Certificate</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Level {level}</CardTitle>
            <CardDescription>
              {points} points • {100 - (points % 100)} points to next level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={points % 100} className="h-2 w-full" />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium">Level {level}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium">Level {level + 1}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Daily Streak</CardTitle>
            <CardDescription>Keep logging in to maintain your streak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-bold">{streak} days</div>
                <div className="text-xs text-muted-foreground">Current streak</div>
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`h-3 w-3 rounded-full ${i < streak % 7 ? "bg-primary" : "bg-secondary"}`} />
                  <div className="text-xs">{i + 1}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Achievements</h2>
          <div className="grid gap-4">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`transition-all ${achievement.unlocked ? "border-primary/50" : ""}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      <span className="mr-2">{achievement.icon}</span>
                      {achievement.title}
                    </CardTitle>
                    <Badge variant={achievement.unlocked ? "default" : "outline"}>
                      {achievement.unlocked ? "Unlocked" : `${achievement.progress}/${achievement.maxProgress}`}
                    </Badge>
                  </div>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-primary" />
                      <span>{achievement.points} points</span>
                    </div>
                    <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
