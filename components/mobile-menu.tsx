"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, Search, UserPlus, Info, LogIn, Settings, Award, LogOut, UserIcon, Wallet } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"

export function MobileMenu({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    onClose()
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  if (!user) {
    return (
      <div className="flex flex-col space-y-4 p-4">
        <MenuItem href="/" icon={<Home className="h-5 w-5" />} label="Home" onClick={onClose} />
        <MenuItem href="/search" icon={<Search className="h-5 w-5" />} label="Search" onClick={onClose} />
        <MenuItem href="/for-students" icon={<Info className="h-5 w-5" />} label="For Students" onClick={onClose} />
        <MenuItem href="/for-employers" icon={<Info className="h-5 w-5" />} label="For Employers" onClick={onClose} />
        <MenuItem href="/register" icon={<UserPlus className="h-5 w-5" />} label="Register" onClick={onClose} />
        <MenuItem href="/login" icon={<LogIn className="h-5 w-5" />} label="Login" onClick={onClose} />
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 p-4">
      {/* User profile section with link to public profile */}
      <Link
        href={`/profile/${user.id}`}
        className="flex items-center space-x-3 rounded-lg p-3 hover:bg-muted"
        onClick={onClose}
      >
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
          <AvatarFallback>{getInitials(user.name || user.email)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">{user.name || user.email}</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      </Link>

      <div className="pt-2">
        <MenuItem href="/" icon={<Home className="h-5 w-5" />} label="Home" onClick={onClose} />
        <MenuItem href="/search" icon={<Search className="h-5 w-5" />} label="Search" onClick={onClose} />

        {user.userType === "student" && (
          <>
            <MenuItem href="/for-students" icon={<Info className="h-5 w-5" />} label="For Students" onClick={onClose} />
            <MenuItem href="/earnings" icon={<Wallet className="h-5 w-5" />} label="My Earnings" onClick={onClose} />
          </>
        )}

        {user.userType === "employer" && (
          <MenuItem href="/for-employers" icon={<Info className="h-5 w-5" />} label="For Employers" onClick={onClose} />
        )}

        <MenuItem
          href={`/profile/${user.id}`}
          icon={<UserIcon className="h-5 w-5" />}
          label="Public Profile"
          onClick={onClose}
        />
        <MenuItem href="/profile" icon={<Settings className="h-5 w-5" />} label="Profile Settings" onClick={onClose} />
        <MenuItem href="/achievements" icon={<Award className="h-5 w-5" />} label="Achievements" onClick={onClose} />

        <button
          className="flex w-full items-center space-x-3 rounded-lg p-3 text-left text-red-500 hover:bg-muted"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

interface MenuItemProps {
  href: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}

function MenuItem({ href, icon, label, onClick }: MenuItemProps) {
  return (
    <Link href={href} className="flex items-center space-x-3 rounded-lg p-3 hover:bg-muted" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </Link>
  )
}
