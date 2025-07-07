"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Settings, Shield, Users, Plus, Trash, Edit, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Mock data for notifications
const mockNotifications = [
  {
    id: "1",
    title: "Welcome to the Platform",
    message: "Thank you for joining our platform. We're excited to have you here!",
    type: "info",
    showToEmployers: true,
    showToStudents: true,
    showToGuests: true,
    active: true,
    startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: "2",
    title: "New Feature: Enhanced Task Management",
    message: "We've added new features to make task management easier. Check it out!",
    type: "info",
    showToEmployers: true,
    showToStudents: false,
    showToGuests: false,
    active: true,
    startDate: Date.now() - 3 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
  },
  {
    id: "3",
    title: "Scheduled Maintenance",
    message: "The platform will be undergoing maintenance on Sunday from 2-4 AM IST.",
    type: "warning",
    showToEmployers: true,
    showToStudents: true,
    showToGuests: true,
    active: true,
    startDate: Date.now() - 1 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 3 * 24 * 60 * 60 * 1000,
  },
]

// Mock data for user lists
const mockUserLists = {
  banned: [
    { id: "1", name: "John Doe", email: "john@example.com", whatsappNumber: "+919876543210" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", whatsappNumber: "+919876543211" },
  ],
  discouraged: [
    { id: "3", name: "Alex Johnson", email: "alex@example.com", whatsappNumber: "+919876543212" },
    { id: "4", name: "Sam Wilson", email: "sam@example.com", whatsappNumber: "+919876543213" },
  ],
  encouraged: [
    { id: "5", name: "Taylor Swift", email: "taylor@example.com", whatsappNumber: "+919876543214" },
    { id: "6", name: "Chris Evans", email: "chris@example.com", whatsappNumber: "+919876543215" },
  ],
}

// Mock data for commission rates
const mockCommissionRates = [
  { minAmount: 0, maxAmount: 999, rate: 15 },
  { minAmount: 1000, maxAmount: 4999, rate: 10 },
  { minAmount: 5000, maxAmount: 9999, rate: 7 },
  { minAmount: 10000, maxAmount: 49999, rate: 5 },
  { minAmount: 50000, maxAmount: Number.POSITIVE_INFINITY, rate: 3 },
]

// Mock data for SOPs
const mockSOPs = [
  {
    id: "1",
    category: "Website Development",
    content:
      "1. Review client requirements\n2. Create wireframes\n3. Get approval\n4. Develop website\n5. Test functionality\n6. Deploy to production",
  },
  {
    id: "2",
    category: "Content Writing",
    content:
      "1. Research the topic thoroughly\n2. Create an outline\n3. Write the first draft\n4. Edit for clarity and flow\n5. Proofread for grammar and spelling\n6. Submit final draft",
  },
  {
    id: "3",
    category: "Graphic Design",
    content:
      "1. Understand the brief\n2. Research and gather inspiration\n3. Create initial concepts\n4. Refine the chosen concept\n5. Present to client\n6. Make revisions if needed\n7. Deliver final files",
  },
]

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("general")
  const [notifications, setNotifications] = useState(mockNotifications)
  const [userLists, setUserLists] = useState(mockUserLists)
  const [commissionRates, setCommissionRates] = useState(mockCommissionRates)
  const [sops, setSOPs] = useState(mockSOPs)

  // Dialog states
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [isDeleteNotificationDialogOpen, setIsDeleteNotificationDialogOpen] = useState(false)
  const [isUserListDialogOpen, setIsUserListDialogOpen] = useState(false)
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false)
  const [isSOPDialogOpen, setIsSOPDialogOpen] = useState(false)
  const [isDeleteSOPDialogOpen, setIsDeleteSOPDialogOpen] = useState(false)

  // Form states
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [selectedUserListType, setSelectedUserListType] = useState<"banned" | "discouraged" | "encouraged">("banned")
  const [selectedUserList, setSelectedUserList] = useState<any[]>([])
  const [selectedCommissionRate, setSelectedCommissionRate] = useState<any>(null)
  const [selectedSOP, setSelectedSOP] = useState<any>(null)
  const [userListCSV, setUserListCSV] = useState("")

  // New notification form
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info",
    showToEmployers: true,
    showToStudents: true,
    showToGuests: false,
    startDate: "",
    endDate: "",
  })

  // New commission rate form
  const [commissionForm, setCommissionForm] = useState({
    minAmount: 0,
    maxAmount: 0,
    rate: 0,
  })

  // New SOP form
  const [sopForm, setSOPForm] = useState({
    category: "",
    content: "",
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
  }, [user, router])

  // Handle notification dialog
  const handleAddNotification = () => {
    setSelectedNotification(null)
    setNotificationForm({
      title: "",
      message: "",
      type: "info",
      showToEmployers: true,
      showToStudents: true,
      showToGuests: false,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    })
    setIsNotificationDialogOpen(true)
  }

  const handleEditNotification = (notification: any) => {
    setSelectedNotification(notification)
    setNotificationForm({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      showToEmployers: notification.showToEmployers,
      showToStudents: notification.showToStudents,
      showToGuests: notification.showToGuests,
      startDate: new Date(notification.startDate).toISOString().split("T")[0],
      endDate: new Date(notification.endDate).toISOString().split("T")[0],
    })
    setIsNotificationDialogOpen(true)
  }

  const handleDeleteNotification = (notification: any) => {
    setSelectedNotification(notification)
    setIsDeleteNotificationDialogOpen(true)
  }

  const confirmDeleteNotification = () => {
    if (!selectedNotification) return

    setNotifications(notifications.filter((n) => n.id !== selectedNotification.id))
    toast({
      title: "Notification Deleted",
      description: "The notification has been deleted successfully.",
    })
    setIsDeleteNotificationDialogOpen(false)
  }

  const handleNotificationSubmit = () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and message for the notification.",
        variant: "destructive",
      })
      return
    }

    if (selectedNotification) {
      // Update existing notification
      setNotifications(
        notifications.map((n) =>
          n.id === selectedNotification.id
            ? {
                ...n,
                title: notificationForm.title,
                message: notificationForm.message,
                type: notificationForm.type,
                showToEmployers: notificationForm.showToEmployers,
                showToStudents: notificationForm.showToStudents,
                showToGuests: notificationForm.showToGuests,
                startDate: new Date(notificationForm.startDate).getTime(),
                endDate: new Date(notificationForm.endDate).getTime(),
              }
            : n,
        ),
      )
      toast({
        title: "Notification Updated",
        description: "The notification has been updated successfully.",
      })
    } else {
      // Add new notification
      setNotifications([
        ...notifications,
        {
          id: Date.now().toString(),
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type,
          showToEmployers: notificationForm.showToEmployers,
          showToStudents: notificationForm.showToStudents,
          showToGuests: notificationForm.showToGuests,
          active: true,
          startDate: new Date(notificationForm.startDate).getTime(),
          endDate: new Date(notificationForm.endDate).getTime(),
        },
      ])
      toast({
        title: "Notification Added",
        description: "The notification has been added successfully.",
      })
    }

    setIsNotificationDialogOpen(false)
  }

  // Handle user list dialog
  const handleManageUserList = (type: "banned" | "discouraged" | "encouraged") => {
    setSelectedUserListType(type)
    setSelectedUserList(userLists[type])
    setUserListCSV("")
    setIsUserListDialogOpen(true)
  }

  const handleUserListCSVChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserListCSV(e.target.value)
  }

  const handleUserListSubmit = () => {
    if (!userListCSV.trim()) {
      toast({
        title: "No Data",
        description: "Please provide CSV data to update the user list.",
        variant: "destructive",
      })
      return
    }

    try {
      // Parse CSV (simple implementation - assumes well-formed CSV)
      const rows = userListCSV.trim().split("\n")
      const newUsers = rows.map((row) => {
        const [name, email, whatsappNumber] = row.split(",").map((item) => item.trim())
        return {
          id: Date.now().toString() + Math.random().toString(36).substring(2),
          name,
          email,
          whatsappNumber,
        }
      })

      // Update the selected user list
      setUserLists({
        ...userLists,
        [selectedUserListType]: newUsers,
      })

      toast({
        title: "User List Updated",
        description: `The ${selectedUserListType} user list has been updated with ${newUsers.length} users.`,
      })
      setIsUserListDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse CSV data. Please check the format and try again.",
        variant: "destructive",
      })
    }
  }

  // Handle commission rate dialog
  const handleAddCommissionRate = () => {
    setSelectedCommissionRate(null)
    setCommissionForm({
      minAmount: 0,
      maxAmount: 0,
      rate: 0,
    })
    setIsCommissionDialogOpen(true)
  }

  const handleEditCommissionRate = (rate: any, index: number) => {
    setSelectedCommissionRate({ ...rate, index })
    setCommissionForm({
      minAmount: rate.minAmount,
      maxAmount: rate.maxAmount === Number.POSITIVE_INFINITY ? 0 : rate.maxAmount,
      rate: rate.rate,
    })
    setIsCommissionDialogOpen(true)
  }

  const handleCommissionSubmit = () => {
    if (commissionForm.minAmount < 0 || commissionForm.rate < 0 || commissionForm.rate > 100) {
      toast({
        title: "Invalid Values",
        description: "Please provide valid values for the commission rate.",
        variant: "destructive",
      })
      return
    }

    const maxAmount = commissionForm.maxAmount === 0 ? Number.POSITIVE_INFINITY : commissionForm.maxAmount

    if (selectedCommissionRate) {
      // Update existing rate
      const updatedRates = [...commissionRates]
      updatedRates[selectedCommissionRate.index] = {
        minAmount: commissionForm.minAmount,
        maxAmount,
        rate: commissionForm.rate,
      }
      setCommissionRates(updatedRates)
      toast({
        title: "Commission Rate Updated",
        description: "The commission rate has been updated successfully.",
      })
    } else {
      // Add new rate
      setCommissionRates([
        ...commissionRates,
        {
          minAmount: commissionForm.minAmount,
          maxAmount,
          rate: commissionForm.rate,
        },
      ])
      toast({
        title: "Commission Rate Added",
        description: "The commission rate has been added successfully.",
      })
    }

    setIsCommissionDialogOpen(false)
  }

  // Handle SOP dialog
  const handleAddSOP = () => {
    setSelectedSOP(null)
    setSOPForm({
      category: "",
      content: "",
    })
    setIsSOPDialogOpen(true)
  }

  const handleEditSOP = (sop: any) => {
    setSelectedSOP(sop)
    setSOPForm({
      category: sop.category,
      content: sop.content,
    })
    setIsSOPDialogOpen(true)
  }

  const handleDeleteSOP = (sop: any) => {
    setSelectedSOP(sop)
    setIsDeleteSOPDialogOpen(true)
  }

  const confirmDeleteSOP = () => {
    if (!selectedSOP) return

    setSOPs(sops.filter((s) => s.id !== selectedSOP.id))
    toast({
      title: "SOP Deleted",
      description: "The Standard Operating Procedure has been deleted successfully.",
    })
    setIsDeleteSOPDialogOpen(false)
  }

  const handleSOPSubmit = () => {
    if (!sopForm.category || !sopForm.content) {
      toast({
        title: "Missing Information",
        description: "Please provide a category and content for the SOP.",
        variant: "destructive",
      })
      return
    }

    if (selectedSOP) {
      // Update existing SOP
      setSOPs(
        sops.map((s) =>
          s.id === selectedSOP.id
            ? {
                ...s,
                category: sopForm.category,
                content: sopForm.content,
              }
            : s,
        ),
      )
      toast({
        title: "SOP Updated",
        description: "The Standard Operating Procedure has been updated successfully.",
      })
    } else {
      // Add new SOP
      setSOPs([
        ...sops,
        {
          id: Date.now().toString(),
          category: sopForm.category,
          content: sopForm.content,
        },
      ])
      toast({
        title: "SOP Added",
        description: "The Standard Operating Procedure has been added successfully.",
      })
    }

    setIsSOPDialogOpen(false)
  }

  // Toggle notification active status
  const toggleNotificationStatus = (id: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id
          ? {
              ...n,
              active: !n.active,
            }
          : n,
      ),
    )
  }

  if (!user || user.userType !== "admin") {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={() => router.push("/admin/dashboard")}>Back to Dashboard</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            User Lists
          </TabsTrigger>
          <TabsTrigger value="sop">
            <Shield className="h-4 w-4 mr-2" />
            SOPs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure general platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input id="platform-name" defaultValue="KushL" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-email">Support Email</Label>
                <Input id="platform-email" defaultValue="support@kushl.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-phone">Support Phone</Label>
                <Input id="platform-phone" defaultValue="+91 98765 43210" />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Commission Rates</h3>
                <p className="text-sm text-muted-foreground">Configure commission rates based on task value</p>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Min Amount (₹)</TableHead>
                        <TableHead>Max Amount (₹)</TableHead>
                        <TableHead>Commission Rate (%)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionRates.map((rate, index) => (
                        <TableRow key={index}>
                          <TableCell>{rate.minAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            {rate.maxAmount === Number.POSITIVE_INFINITY ? "∞" : rate.maxAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>{rate.rate}%</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEditCommissionRate(rate, index)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button onClick={handleAddCommissionRate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Commission Rate
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Notifications</CardTitle>
              <CardDescription>Manage notifications shown to users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button onClick={handleAddNotification}>
                <Plus className="h-4 w-4 mr-2" />
                Add Notification
              </Button>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No notifications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell className="font-medium">{notification.title}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                notification.type === "warning"
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  : notification.type === "error"
                                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                                    : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              }
                            >
                              {notification.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {notification.showToEmployers && (
                                <Badge variant="outline" className="bg-gray-100">
                                  Employers
                                </Badge>
                              )}
                              {notification.showToStudents && (
                                <Badge variant="outline" className="bg-gray-100">
                                  Students
                                </Badge>
                              )}
                              {notification.showToGuests && (
                                <Badge variant="outline" className="bg-gray-100">
                                  Guests
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>From: {new Date(notification.startDate).toLocaleDateString()}</div>
                              <div>To: {new Date(notification.endDate).toLocaleDateString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={notification.active}
                              onCheckedChange={() => toggleNotificationStatus(notification.id)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditNotification(notification)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteNotification(notification)}>
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Lists</CardTitle>
              <CardDescription>Manage special user lists for platform behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
                    <CardDescription>Users who are shadow-banned from the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userLists.banned.length}</div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => handleManageUserList("banned")}>
                      Manage List
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Discouraged Users</CardTitle>
                    <CardDescription>Users who experience subtle limitations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userLists.discouraged.length}</div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => handleManageUserList("discouraged")}>
                      Manage List
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Encouraged Users</CardTitle>
                    <CardDescription>Users who receive preferential treatment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userLists.encouraged.length}</div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => handleManageUserList("encouraged")}>
                      Manage List
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Current Lists</h3>

                <Tabs defaultValue="banned" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="banned">Banned</TabsTrigger>
                    <TabsTrigger value="discouraged">Discouraged</TabsTrigger>
                    <TabsTrigger value="encouraged">Encouraged</TabsTrigger>
                  </TabsList>
                  <TabsContent value="banned" className="mt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>WhatsApp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userLists.banned.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                No banned users found
                              </TableCell>
                            </TableRow>
                          ) : (
                            userLists.banned.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.whatsappNumber}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  <TabsContent value="discouraged" className="mt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>WhatsApp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userLists.discouraged.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                No discouraged users found
                              </TableCell>
                            </TableRow>
                          ) : (
                            userLists.discouraged.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.whatsappNumber}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  <TabsContent value="encouraged" className="mt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>WhatsApp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userLists.encouraged.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                No encouraged users found
                              </TableCell>
                            </TableRow>
                          ) : (
                            userLists.encouraged.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.whatsappNumber}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sop" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Operating Procedures</CardTitle>
              <CardDescription>Manage SOPs for different task categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button onClick={handleAddSOP}>
                <Plus className="h-4 w-4 mr-2" />
                Add SOP
              </Button>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Content Preview</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sops.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          No SOPs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sops.map((sop) => (
                        <TableRow key={sop.id}>
                          <TableCell className="font-medium">{sop.category}</TableCell>
                          <TableCell>
                            <div className="max-w-md truncate">{sop.content.substring(0, 100)}...</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditSOP(sop)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSOP(sop)}>
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Dialog */}
      <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedNotification ? "Edit Notification" : "Add Notification"}</DialogTitle>
            <DialogDescription>Create a notification to display to users on the platform.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                placeholder="Notification message"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={notificationForm.type}
                  onValueChange={(value) => setNotificationForm({ ...notificationForm, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Show To</Label>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-employers"
                      checked={notificationForm.showToEmployers}
                      onCheckedChange={(checked) =>
                        setNotificationForm({ ...notificationForm, showToEmployers: checked })
                      }
                    />
                    <Label htmlFor="show-employers" className="font-normal">
                      Employers
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-students"
                      checked={notificationForm.showToStudents}
                      onCheckedChange={(checked) =>
                        setNotificationForm({ ...notificationForm, showToStudents: checked })
                      }
                    />
                    <Label htmlFor="show-students" className="font-normal">
                      Students
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-guests"
                      checked={notificationForm.showToGuests}
                      onCheckedChange={(checked) => setNotificationForm({ ...notificationForm, showToGuests: checked })}
                    />
                    <Label htmlFor="show-guests" className="font-normal">
                      Guests
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={notificationForm.startDate}
                  onChange={(e) => setNotificationForm({ ...notificationForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={notificationForm.endDate}
                  onChange={(e) => setNotificationForm({ ...notificationForm, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNotificationSubmit}>{selectedNotification ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Notification Dialog */}
      <Dialog open={isDeleteNotificationDialogOpen} onOpenChange={setIsDeleteNotificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <div>
                <p className="font-medium">{selectedNotification?.title}</p>
                <p className="text-sm text-muted-foreground">{selectedNotification?.message}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteNotificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteNotification}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User List Dialog */}
      <Dialog open={isUserListDialogOpen} onOpenChange={setIsUserListDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Manage {selectedUserListType.charAt(0).toUpperCase() + selectedUserListType.slice(1)} Users
            </DialogTitle>
            <DialogDescription>Upload a CSV list of users to update the {selectedUserListType} list.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="csv-data">CSV Data (Name, Email, WhatsApp Number)</Label>
              <Textarea
                id="csv-data"
                value={userListCSV}
                onChange={handleUserListCSVChange}
                placeholder="John Doe, john@example.com, +919876543210"
                rows={10}
              />
              <p className="text-xs text-muted-foreground">
                Enter one user per line in the format: Name, Email, WhatsApp Number
              </p>
            </div>
            <div className="space-y-2">
              <Label>Current Users ({selectedUserList.length})</Label>
              <ScrollArea className="h-[200px] rounded-md border p-2">
                {selectedUserList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No users in this list</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUserList.map((user) => (
                      <div key={user.id} className="flex justify-between items-center py-1 border-b">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <p className="text-sm">{user.whatsappNumber}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserListDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUserListSubmit}>Update List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commission Rate Dialog */}
      <Dialog open={isCommissionDialogOpen} onOpenChange={setIsCommissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCommissionRate ? "Edit Commission Rate" : "Add Commission Rate"}</DialogTitle>
            <DialogDescription>Set commission rates based on task value ranges.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="min-amount">Minimum Amount (₹)</Label>
              <Input
                id="min-amount"
                type="number"
                min="0"
                value={commissionForm.minAmount}
                onChange={(e) =>
                  setCommissionForm({ ...commissionForm, minAmount: Number.parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-amount">Maximum Amount (₹)</Label>
              <Input
                id="max-amount"
                type="number"
                min="0"
                value={commissionForm.maxAmount}
                onChange={(e) =>
                  setCommissionForm({ ...commissionForm, maxAmount: Number.parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">Enter 0 for unlimited (infinity)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Commission Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                max="100"
                value={commissionForm.rate}
                onChange={(e) => setCommissionForm({ ...commissionForm, rate: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCommissionSubmit}>{selectedCommissionRate ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SOP Dialog */}
      <Dialog open={isSOPDialogOpen} onOpenChange={setIsSOPDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSOP ? "Edit Standard Operating Procedure" : "Add Standard Operating Procedure"}
            </DialogTitle>
            <DialogDescription>Create SOPs for different task categories.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={sopForm.category} onValueChange={(value) => setSOPForm({ ...sopForm, category: value })}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Website Development",
                    "Content Writing",
                    "Graphic Design",
                    "Video Editing",
                    "Social Media Marketing",
                    "SEO",
                    "App Development",
                  ].map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">SOP Content</Label>
              <Textarea
                id="content"
                value={sopForm.content}
                onChange={(e) => setSOPForm({ ...sopForm, content: e.target.value })}
                placeholder="Enter the step-by-step procedure..."
                rows={10}
              />
              <p className="text-xs text-muted-foreground">
                Enter each step on a new line. Use clear, concise instructions.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSOPDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSOPSubmit}>{selectedSOP ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete SOP Dialog */}
      <Dialog open={isDeleteSOPDialogOpen} onOpenChange={setIsDeleteSOPDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Standard Operating Procedure</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this SOP? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <div>
                <p className="font-medium">{selectedSOP?.category}</p>
                <p className="text-sm text-muted-foreground truncate">{selectedSOP?.content.substring(0, 100)}...</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteSOPDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSOP}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
