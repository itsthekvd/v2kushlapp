"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  User,
  Briefcase,
  ClipboardList,
  FileText,
  CheckSquare,
  LayoutDashboard,
  Home,
  Search,
  UserPlus,
  Info,
  LogIn,
  Plus,
  Users,
  DollarSign,
  BarChart2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { getDefaultProjectId } from "@/lib/default-project"

export function MobileNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null)

  // Hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      const storedDefaultProjectId = localStorage.getItem(`kushl_default_project_${user.id}`)
      setDefaultProjectId(storedDefaultProjectId)
    }
  }, [user])

  useEffect(() => {
    if (user?.userType === "employer") {
      const projectId = getDefaultProjectId(user.id)
      setDefaultProjectId(projectId)
    }
  }, [user])

  if (!mounted) return null

  // Don't show navigation on auth pages
  if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/register/")) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-background safe-bottom">
      <div className="flex h-16 items-center justify-around px-2">
        {!user ? (
          // Non-logged in user navigation - marketing focused
          <>
            <NavItem href="/" icon={<Home className="h-6 w-6" />} label="Home" isActive={pathname === "/"} />

            <NavItem
              href="/explore"
              icon={<Search className="h-6 w-6" />}
              label="Explore"
              isActive={pathname === "/explore"}
            />

            <NavItem
              href="/register"
              icon={
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-primary/10 animate-pulse-ring"></div>
                  <UserPlus className="h-7 w-7" />
                </div>
              }
              label="Register"
              isActive={pathname === "/register"}
              isPrimary
            />

            <NavItem
              href="/for-students"
              icon={<Info className="h-6 w-6" />}
              label="About"
              isActive={pathname === "/for-students" || pathname === "/for-employers"}
            />

            <NavItem
              href="/login"
              icon={<LogIn className="h-6 w-6" />}
              label="Login"
              isActive={pathname === "/login"}
            />
          </>
        ) : user.userType === "admin" ? (
          // Admin navigation
          <>
            <NavItem
              href="/admin/dashboard"
              icon={<LayoutDashboard className="h-6 w-6" />}
              label="Dashboard"
              isActive={pathname === "/admin/dashboard"}
            />

            <NavItem
              href="/admin/users"
              icon={<Users className="h-6 w-6" />}
              label="Users"
              isActive={pathname.startsWith("/admin/users")}
            />

            <NavItem
              href="/admin/tasks"
              icon={<ClipboardList className="h-6 w-6" />}
              label="Tasks"
              isActive={pathname === "/admin/tasks"}
            />

            <NavItem
              href="/admin/payments"
              icon={<DollarSign className="h-6 w-6" />}
              label="Payments"
              isActive={pathname === "/admin/payments"}
            />

            <NavItem
              href="/admin/analytics"
              icon={<BarChart2 className="h-6 w-6" />}
              label="Analytics"
              isActive={pathname === "/admin/analytics"}
            />
          </>
        ) : user.userType === "employer" ? (
          // Employer navigation
          <>
            <NavItem
              href="/dashboard"
              icon={<LayoutDashboard className="h-6 w-6" />}
              label="Dashboard"
              isActive={pathname === "/dashboard"}
            />

            <NavItem
              href="/applications"
              icon={<FileText className="h-6 w-6" />}
              label="Applications"
              isActive={pathname === "/applications"}
            />

            <Link
              href={user?.userType === "employer" ? `/post/project/${defaultProjectId}/create-task` : "/explore"}
              className="flex flex-col items-center justify-center relative"
            >
              <div className="relative">
                <Plus className="h-6 w-6 text-primary" />
                <span className="absolute inset-0 rounded-full animate-pulse-subtle bg-primary/10"></span>
              </div>
              <span className="text-xs mt-1">Post</span>
            </Link>

            <NavItem
              href="/my-tasks"
              icon={<ClipboardList className="h-6 w-6" />}
              label="My Tasks"
              isActive={pathname === "/my-tasks"}
            />

            <NavItem
              href={`/profile/${user.id}`}
              icon={<User className="h-6 w-6" />}
              label="Profile"
              isActive={pathname === "/profile" || pathname.startsWith("/profile/")}
            />
          </>
        ) : (
          // Student navigation
          <>
            <NavItem
              href="/dashboard"
              icon={<LayoutDashboard className="h-6 w-6" />}
              label="Dashboard"
              isActive={pathname === "/dashboard"}
            />

            <NavItem
              href="/applications"
              icon={<FileText className="h-6 w-6" />}
              label="Applications"
              isActive={pathname === "/applications"}
            />

            <NavItem
              href="/explore"
              icon={
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-primary/10 animate-pulse-ring"></div>
                  <Briefcase className="h-7 w-7" />
                </div>
              }
              label="Work"
              isActive={pathname === "/explore"}
              isPrimary
            />

            <NavItem
              href="/active-tasks"
              icon={<CheckSquare className="h-6 w-6" />}
              label="Active Tasks"
              isActive={pathname === "/active-tasks"}
            />

            <NavItem
              href={`/profile/${user.id}`}
              icon={<User className="h-6 w-6" />}
              label="Profile"
              isActive={pathname === "/profile" || pathname.startsWith("/profile/")}
            />
          </>
        )}
      </div>
    </div>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  isPrimary?: boolean
}

function NavItem({ href, icon, label, isActive, isPrimary }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground",
        isPrimary && "text-primary",
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}
