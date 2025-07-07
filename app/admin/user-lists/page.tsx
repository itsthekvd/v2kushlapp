"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUsersByType } from "@/lib/storage"
import {
  type UserListType,
  getUsersFromList,
  addUserToList,
  removeUserFromList,
  importUsersToList,
  exportUsersFromList,
  searchUsersInList,
} from "@/lib/user-lists"
import { Ban, Check, Download, Search, Trash, Upload, UserPlus, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// Form schema for adding a user to a list
const addUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  reason: z.string().optional(),
})

type AddUserFormValues = z.infer<typeof addUserSchema>

export default function UserListsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<UserListType>("banned")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importData, setImportData] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [allUsers, setAllUsers] = useState<any[]>([])

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      userId: "",
      username: "",
      email: "",
      reason: "",
    },
  })

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

    // Load all users for reference
    const employers = getUsersByType("employer")
    const students = getUsersByType("student")
    const admins = getUsersByType("admin")
    setAllUsers([...employers, ...students, ...admins])

    loadUserList()
  }, [user, router, activeTab])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
    } else {
      const results = searchUsersInList(activeTab, searchQuery)
      setFilteredUsers(results)
    }
  }, [searchQuery, users, activeTab])

  const loadUserList = () => {
    setIsLoading(true)
    const listUsers = getUsersFromList(activeTab)
    setUsers(listUsers)
    setFilteredUsers(listUsers)
    setIsLoading(false)
  }

  const handleAddUser = (data: AddUserFormValues) => {
    if (user) {
      const success = addUserToList(activeTab, {
        ...data,
        addedBy: user.id,
      })

      if (success) {
        setIsAddDialogOpen(false)
        form.reset()
        loadUserList()
      }
    }
  }

  const handleRemoveUser = (userId: string) => {
    const success = removeUserFromList(activeTab, userId)
    if (success) {
      loadUserList()
    }
  }

  const handleImportUsers = () => {
    if (user && importData) {
      const addedCount = importUsersToList(activeTab, importData, user.id)
      if (addedCount > 0) {
        setIsImportDialogOpen(false)
        setImportData("")
        loadUserList()
      }
    }
  }

  const handleExportUsers = () => {
    const csvData = exportUsersFromList(activeTab)
    if (csvData) {
      const blob = new Blob([csvData], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${activeTab}-users.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const getListIcon = (type: UserListType) => {
    switch (type) {
      case "banned":
        return <Ban className="h-5 w-5" />
      case "discouraged":
        return <X className="h-5 w-5" />
      case "encouraged":
        return <Check className="h-5 w-5" />
    }
  }

  const getListTitle = (type: UserListType) => {
    switch (type) {
      case "banned":
        return "Banned Users"
      case "discouraged":
        return "Discouraged Users"
      case "encouraged":
        return "Encouraged Users"
    }
  }

  const getListDescription = (type: UserListType) => {
    switch (type) {
      case "banned":
        return "Users who are shadow-banned from the platform"
      case "discouraged":
        return "Users who experience subtle limitations"
      case "encouraged":
        return "Users who receive preferential treatment"
    }
  }

  if (!user || user.userType !== "admin") {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Lists Management</h1>
        <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserListType)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="banned" className="flex items-center gap-2">
            <Ban className="h-4 w-4" /> Banned
          </TabsTrigger>
          <TabsTrigger value="discouraged" className="flex items-center gap-2">
            <X className="h-4 w-4" /> Discouraged
          </TabsTrigger>
          <TabsTrigger value="encouraged" className="flex items-center gap-2">
            <Check className="h-4 w-4" /> Encouraged
          </TabsTrigger>
        </TabsList>

        {["banned", "discouraged", "encouraged"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getListIcon(tab as UserListType)} {getListTitle(tab as UserListType)}
                    </CardTitle>
                    <CardDescription>{getListDescription(tab as UserListType)}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" /> Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add User to {getListTitle(activeTab)}</DialogTitle>
                          <DialogDescription>
                            Enter the user details to add them to the {activeTab} list.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleAddUser)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="userId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>User ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter user ID" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter email" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="reason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Reason (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Enter reason" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="submit">Add User</Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Upload className="h-4 w-4" /> Import
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Import Users to {getListTitle(activeTab)}</DialogTitle>
                          <DialogDescription>
                            Paste CSV data with headers: userId,username,email,reason
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="userId,username,email,reason"
                          value={importData}
                          onChange={(e) => setImportData(e.target.value)}
                          className="min-h-[200px]"
                        />
                        <DialogFooter>
                          <Button onClick={handleImportUsers}>Import Users</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" onClick={handleExportUsers} className="flex items-center gap-2">
                      <Download className="h-4 w-4" /> Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No users found in this list.</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Added On</TableHead>
                          <TableHead>Added By</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.userId}>
                            <TableCell className="font-medium">{user.userId}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{new Date(user.addedAt).toLocaleDateString()}</TableCell>
                            <TableCell>{user.addedBy}</TableCell>
                            <TableCell>{user.reason || "-"}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveUser(user.userId)}
                                title="Remove from list"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
