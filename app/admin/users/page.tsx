"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUsersByType, updateUserStatus, resetUserPassword } from "@/lib/storage"
import { Search, MoreHorizontal, UserCheck, UserX, Lock, Eye, Mail, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function AdminUsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("employers")
  const [employers, setEmployers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)

  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "admin") {
      router.push("/")
      return
    }

    // Load users data
    const loadUsersData = () => {
      try {
        setIsLoading(true)

        // Get users by type
        const employersList = getUsersByType("employer")
        const studentsList = getUsersByType("student")
        const adminsList = getUsersByType("admin")

        setEmployers(employersList)
        setStudents(studentsList)
        setAdmins(adminsList)

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading users data:", error)
        setIsLoading(false)
      }
    }

    loadUsersData()

    // Refresh data every 5 minutes
    const intervalId = setInterval(loadUsersData, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [user, router])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const filteredEmployers = employers.filter(
    (employer) =>
      employer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employer.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredStudents = students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleBlockUser = (user: any) => {
    setSelectedUser(user)
    setIsBlockDialogOpen(true)
  }

  const confirmBlockUser = () => {
    if (!selectedUser) return

    const newStatus = selectedUser.status === "blocked" ? "active" : "blocked"
    const success = updateUserStatus(selectedUser.id, newStatus)

    if (success) {
      toast({
        title: `User ${newStatus === "blocked" ? "Blocked" : "Unblocked"}`,
        description: `${selectedUser.fullName} has been ${newStatus === "blocked" ? "blocked" : "unblocked"} successfully.`,
        variant: newStatus === "blocked" ? "destructive" : "default",
      })

      // Update local state
      if (selectedUser.userType === "employer") {
        setEmployers((prev) => prev.map((emp) => (emp.id === selectedUser.id ? { ...emp, status: newStatus } : emp)))
      } else if (selectedUser.userType === "student") {
        setStudents((prev) => prev.map((stu) => (stu.id === selectedUser.id ? { ...stu, status: newStatus } : stu)))
      } else if (selectedUser.userType === "admin") {
        setAdmins((prev) => prev.map((adm) => (adm.id === selectedUser.id ? { ...adm, status: newStatus } : adm)))
      }
    } else {
      toast({
        title: "Error",
        description: `Failed to ${newStatus === "blocked" ? "block" : "unblock"} user. Please try again.`,
        variant: "destructive",
      })
    }

    setIsBlockDialogOpen(false)
  }

  const handleResetPassword = (user: any) => {
    setSelectedUser(user)
    setIsResetPasswordDialogOpen(true)
  }

  const confirmResetPassword = () => {
    if (!selectedUser) return

    const success = resetUserPassword(selectedUser.id)

    if (success) {
      toast({
        title: "Password Reset",
        description: `Password reset link has been sent to ${selectedUser.email}.`,
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      })
    }

    setIsResetPasswordDialogOpen(false)
  }

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  const renderUserTable = (users: any[], userType: string) => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No {userType} found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={userType === "student" ? user.profile?.profilePicture : user.profile?.companyLogo}
                          alt={user.fullName}
                        />
                        <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "blocked" ? "destructive" : "outline"}
                      className={user.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                    >
                      {user.status || "active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastActiveDate ? new Date(user.lastActiveDate).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.isProfileComplete ? "Complete" : "Incomplete"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewProfile(user.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => (window.location.href = `mailto:${user.email}`)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                          <Lock className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBlockUser(user)}>
                          {user.status === "blocked" ? (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Unblock User
                            </>
                          ) : (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Block User
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (!user || user.userType !== "admin") {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => router.push("/admin/dashboard")}>Back to Dashboard</Button>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-8" value={searchQuery} onChange={handleSearch} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employers">Employers ({employers.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="employers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Employers</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                renderUserTable(filteredEmployers, "employers")
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                renderUserTable(filteredStudents, "students")
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Admins</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                renderUserTable(filteredAdmins, "admins")
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Block User Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser?.status === "blocked" ? "Unblock User" : "Block User"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4">
              {selectedUser?.status === "blocked" ? (
                <CheckCircle className="h-10 w-10 text-green-500" />
              ) : (
                <AlertTriangle className="h-10 w-10 text-amber-500" />
              )}
              <div>
                <p className="font-medium">{selectedUser?.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>
            <p className="mt-4">
              {selectedUser?.status === "blocked"
                ? "Are you sure you want to unblock this user? They will regain access to the platform."
                : "Are you sure you want to block this user? They will lose access to the platform."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant={selectedUser?.status === "blocked" ? "default" : "destructive"} onClick={confirmBlockUser}>
              {selectedUser?.status === "blocked" ? "Unblock User" : "Block User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4">
              <Lock className="h-10 w-10 text-blue-500" />
              <div>
                <p className="font-medium">{selectedUser?.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>
            <p className="mt-4">
              Are you sure you want to reset the password for this user? A password reset link will be sent to their
              email address.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmResetPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
