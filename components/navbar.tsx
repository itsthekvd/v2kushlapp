"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, ChevronDown, LogOut, Settings, User, FileText, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">KushL</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/" ? "text-primary" : "text-muted-foreground",
              )}
            >
              Home
            </Link>
            <Link
              href="/explore"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/explore" ? "text-primary" : "text-muted-foreground",
              )}
            >
              Explore
            </Link>
            {user?.userType === "employer" && (
              <>
                <Link
                  href="/post"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/post" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  Post Task
                </Link>
                <Link
                  href="/my-tasks"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/my-tasks" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  My Tasks
                </Link>
                <Link
                  href="/applications"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/applications" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  Applications
                </Link>
              </>
            )}
            {user?.userType === "student" && (
              <Link
                href="/applications"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/applications" ? "text-primary" : "text-muted-foreground",
                )}
              >
                My Applications
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  3
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.userType === "student" ? user.profile?.profilePicture : user.profile?.companyLogo}
                      />
                      <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden md:inline-block">{user.fullName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.id}`} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.userType === "employer" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/my-tasks" className="cursor-pointer">
                          <ClipboardList className="mr-2 h-4 w-4" />
                          <span>My Tasks</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/applications" className="cursor-pointer">
                          <FileText className="mr-2 h-4 w-4" />
                          <span>Applications</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.userType === "student" && (
                    <DropdownMenuItem asChild>
                      <Link href="/applications" className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>My Applications</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
