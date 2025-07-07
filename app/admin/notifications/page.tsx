"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Bell, Plus, Edit, Trash, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getNotifications, addNotification, updateNotification, deleteNotification } from "@/lib/admin"

export default function AdminNotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
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

    // Load notifications
    const loadNotifications = async () => {
      try {
        setIsLoading(true)
        const fetchedNotifications = await getNotifications()
        setNotifications(fetchedNotifications)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading notifications:", error)
        setIsLoading(false)
      }
    }

    loadNotifications()
  }, [user, router])

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
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteNotification = async () => {
    if (!selectedNotification) return

    try {
      const result = await deleteNotification(selectedNotification.id)

      if (result.success) {
        setNotifications(notifications.filter((n) => n.id !== selectedNotification.id))

        toast({
          title: "Notification Deleted",
          description: "The notification has been deleted successfully.",
        })
      } else {
        throw new Error(result.message || "Failed to delete notification")
      }
    } catch (error) {
      console.error("Error deleting notification:", error)

      toast({
        title: "Error",
        description: "Failed to delete notification. Please try again.",
        variant: "destructive",
      })
    }

    setIsDeleteDialogOpen(false)
  }

  const handleNotificationSubmit = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and message for the notification.",
        variant: "destructive",
      })
      return
    }

    try {
      const notificationData = {
        ...notificationForm,
        startDate: new Date(notificationForm.startDate).getTime(),
        endDate: new Date(notificationForm.endDate).getTime(),
        active: true,
      }

      if (selectedNotification) {
        // Update existing notification
        const result = await updateNotification(selectedNotification.id, notificationData)

        if (result.success) {
          setNotifications(
            notifications.map((n) => (n.id === selectedNotification.id ? { ...n, ...notificationData } : n)),
          )

          toast({
            title: "Notification Updated",
            description: "The notification has been updated successfully.",
          })
        } else {
          throw new Error(result.message || "Failed to update notification")
        }
      } else {
        // Add new notification
        const result = await addNotification(notificationData)

        if (result.success) {
          setNotifications([...notifications, result.notification])

          toast({
            title: "Notification Added",
            description: "The notification has been added successfully.",
          })
        } else {
          throw new Error(result.message || "Failed to add notification")
        }
      }
    } catch (error) {
      console.error("Error saving notification:", error)

      toast({
        title: "Error",
        description: "Failed to save notification. Please try again.",
        variant: "destructive",
      })
    }

    setIsNotificationDialogOpen(false)
  }

  const toggleNotificationStatus = async (id: string, currentActive: boolean) => {
    try {
      const notification = notifications.find((n) => n.id === id)
      if (!notification) return

      const result = await updateNotification(id, { active: !currentActive })

      if (result.success) {
        setNotifications(notifications.map((n) => (n.id === id ? { ...n, active: !currentActive } : n)))

        toast({
          title: currentActive ? "Notification Deactivated" : "Notification Activated",
          description: `The notification has been ${currentActive ? "deactivated" : "activated"}.`,
        })
      } else {
        throw new Error(result.message || "Failed to update notification status")
      }
    } catch (error) {
      console.error("Error toggling notification status:", error)

      toast({
        title: "Error",
        description: "Failed to update notification status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case "info":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Bell className="h-3 w-3 mr-1" />
            Info
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Warning
          </Badge>
        )
      case "success":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Bell className="h-3 w-3 mr-1" />
            Info
          </Badge>
        )
    }
  }

  if (!user || user.userType !== "admin") {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Platform Notifications</h1>
        <Button onClick={() => router.push("/admin/dashboard")}>Back to Dashboard</Button>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleAddNotification}>
          <Plus className="h-4 w-4 mr-2" />
          Add Notification
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Notifications</CardTitle>
          <CardDescription>Create and manage notifications shown to users on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
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
                        <TableCell>{getNotificationTypeBadge(notification.type)}</TableCell>
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
                            onCheckedChange={() => toggleNotificationStatus(notification.id, notification.active)}
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
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Notification Dialog */}
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
                    <SelectItem value="success">Success</SelectItem>
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteNotification}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
